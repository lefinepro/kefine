require "db"
require "json"
require "log"
require "pg"
require "aptok/federation/federation"
require "aptok/federation/federation_context"
require "aptok/relay/relay"
require "aptok/store/postgres"
require "./aptok"
require "./utils/config"

module Lepos
  module RelayService
    @@store : ::Aptok::KvStore? = nil
    @@store_lock = Mutex.new

    def self.json_map_from_body(body : String) : ::Aptok::JsonMap
      parsed = JSON.parse(body)
      map = parsed.as_h? || raise JSON::ParseException.new("Activity payload must be an object", 1, 1)
      map.as(::Aptok::JsonMap)
    end

    def self.store(config : Utils::Config) : ::Aptok::KvStore
      cached = @@store
      return cached if cached

      @@store_lock.synchronize do
        @@store ||= begin
          connection = ::Aptok::PostgresConnection.connect(config.database_url)
          ::Aptok::SqlKvStore.new(connection, ::Aptok::SqlDialect::Postgres, "lepos_relay_kv")
        end
      end
    end

    def self.subscriptions(config : Utils::Config, store : ::Aptok::KvStore = store(config)) : ::Aptok::Relay::Subscriptions
      ::Aptok::Relay::Subscriptions.new(store, config.relay_actor_id, prefix: "lepos:relay:subscriber")
    end

    def self.server(config : Utils::Config, store : ::Aptok::KvStore = store(config)) : ::Aptok::Relay::Server
      ::Aptok::Relay::Server.new(config.relay_actor_id, config.relay_actor_username, subscriptions(config, store))
    end

    def self.federation(config : Utils::Config, transport : ::Aptok::Transport = ::Aptok::Transport.new(signature_enabled: false)) : ::Aptok::Federation
      federation = ::Aptok::Federation.create(config.crater_url, transport)
      federation.actor("/actor/{identifier}") do |_ctx, identifier|
        AptokPayload.actor_json(identifier, config)
      end
      federation
    end

    def self.context(config : Utils::Config, transport : ::Aptok::Transport = ::Aptok::Transport.new(signature_enabled: false)) : ::Aptok::Context
      federation(config, transport).create_context(config.relay_actor_username)
    end

    def self.handle_control(
      activity : ::Aptok::JsonMap,
      config : Utils::Config,
      store : ::Aptok::KvStore = store(config),
      transport : ::Aptok::Transport = ::Aptok::Transport.new(signature_enabled: false),
    ) : ::Aptok::Relay::HandleResult
      server(config, store).handle(context(config, transport), activity)
    end

    # Internal relay subscribers wired up through `kefine.config.json`. They are
    # delivered the same relayed activity as external API subscribers that joined
    # via the ActivityPub follow handshake.
    def self.internal_recipients(config : Utils::Config) : Array(::Aptok::Recipient)
      config.relay_internal_services.map do |service|
        ::Aptok::Recipient.new(service.id, service.inbox, [service.id], service.shared_inbox)
      end
    end

    # Fan a relayed public activity out to both the stored external subscribers
    # and the internal services configured in `kefine.config.json`, excluding the
    # activity's origin and de-duplicating by delivery inbox. Returns the
    # activities actually delivered.
    def self.relay_activity(
      activity : ::Aptok::JsonMap,
      config : Utils::Config,
      store : ::Aptok::KvStore = store(config),
      transport : ::Aptok::Transport = ::Aptok::Transport.new(signature_enabled: false),
      origins : Array(String) = [] of String,
    ) : Array(::Aptok::SentActivity)
      return [] of ::Aptok::SentActivity unless ::Aptok::Relay.relayable?(activity)

      subs = subscriptions(config, store)
      activity_id = activity["id"]?.try(&.as_s?)
      return [] of ::Aptok::SentActivity if activity_id && subs.relayed?(activity_id)

      all_origins = origins.dup
      if all_origins.empty? && (origin = ::Aptok::Relay.actor_id(activity))
        all_origins << origin
      end

      recipients = subs.recipients + internal_recipients(config)
      targets = ::Aptok::Relay.fanout_recipients(recipients, all_origins)
      return [] of ::Aptok::SentActivity if targets.empty?

      sent = context(config, transport).send_activity(config.relay_actor_username, targets, activity)
      subs.mark_relayed(activity_id) if activity_id
      sent
    end

    def self.control_activity?(activity : ::Aptok::JsonMap, config : Utils::Config) : Bool
      ::Aptok::Relay.subscription?(activity, config.relay_actor_id) || (::Aptok::Relay.unsubscription?(activity) && addressed_to_relay?(activity, config))
    end

    def self.relayable_public_activity?(activity : ::Aptok::JsonMap) : Bool
      ::Aptok::Relay.relayable?(activity) && addressed_to_public?(activity)
    end

    def self.addressed_to_relay?(activity : ::Aptok::JsonMap, config : Utils::Config) : Bool
      addressed_to?(activity, config.relay_actor_id) || addressed_to?(activity, config.relay_followers) || object_targets_relay?(activity, config)
    end

    def self.followers_collection(config : Utils::Config, store : ::Aptok::KvStore = store(config)) : ::Aptok::JsonMap
      actor_ids = (subscriptions(config, store).actor_ids + internal_recipients(config).map(&.id)).uniq
      ::Aptok::JsonMap{
        "@context"     => ::Aptok.json(::Aptok::ACTIVITYSTREAMS_CONTEXT),
        "id"           => ::Aptok.json(config.relay_followers),
        "type"         => ::Aptok.json("OrderedCollection"),
        "totalItems"   => ::Aptok.json(actor_ids.size),
        "orderedItems" => ::Aptok.json(actor_ids),
      }
    end

    def self.metadata(config : Utils::Config, store : ::Aptok::KvStore = store(config)) : ::Aptok::JsonMap
      internal = internal_recipients(config)
      ::Aptok::JsonMap{
        "relayActor"             => ::Aptok.json(config.relay_actor_id),
        "relayInbox"             => ::Aptok.json(config.relay_inbox),
        "relayOutbox"            => ::Aptok.json(config.relay_outbox),
        "relayFollowers"         => ::Aptok.json(config.relay_followers),
        "protocols"              => ::Aptok.json(["mastodon", "litepub"]),
        "subscriberCount"        => ::Aptok.json(subscriptions(config, store).size),
        "internalServiceCount"   => ::Aptok.json(internal.size),
        "internalServiceActors"  => ::Aptok.json(internal.map(&.id)),
      }
    end

    private def self.addressed_to_public?(activity : ::Aptok::JsonMap) : Bool
      addressed_to?(activity, ::Aptok::PUBLIC_COLLECTION)
    end

    private def self.object_targets_relay?(activity : ::Aptok::JsonMap, config : Utils::Config) : Bool
      object = activity["object"]?
      return false unless object

      if map = object.as_h?
        return true if same_resource?(::Aptok::Relay.object_uri(object), config.relay_actor_id)
        return addressed_to?(map.as(::Aptok::JsonMap), config.relay_actor_id)
      end

      same_resource?(::Aptok::Relay.object_uri(object), config.relay_actor_id)
    end

    private def self.addressed_to?(activity : ::Aptok::JsonMap, target : String) : Bool
      %w[to cc bto bcc audience].any? do |field|
        value_targets?(activity[field]?, target)
      end
    end

    private def self.value_targets?(value : JSON::Any?, target : String) : Bool
      return false unless value

      if id = ::Aptok::Relay.object_uri(value)
        return true if same_resource?(id, target)
      end

      if array = value.as_a?
        return array.any? { |item| value_targets?(item, target) }
      end

      false
    end

    private def self.same_resource?(left : String?, right : String) : Bool
      return false unless left

      ::Aptok.same_resource_id?(left, right)
    end
  end
end
