require "db"
require "http/client"
require "json"
require "mutex"
require "pg"
require "time"
require "uri"
require "uuid"

require "./activitypub/types"
require "./forgefed/types"
require "./utils/actor_keys"
require "./utils/config"
require "./solver_fetcher"

module Lepos
  module OrderQueue
    EVENT_PAGE_SIZE = 20

    class SolverRecord
      property id : String
      property name : String
      property handle : String
      property profile_url : String
      property type : String

      def initialize(@id : String, @name : String, @handle : String, @profile_url : String, @type : String = "actor")
      end
    end

    class OrderRecord
      property id : String
      property status : String
      property solver : String
      property solver_name : String?
      property solver_handle : String?
      property solver_profile_url : String?
      property title : String
      property description : String?
      property estimated_cost : Float64?
      property currency : String
      property execution_estimate : String?
      property created_at : String
      property updated_at : String
      property payment_url : String?
      property ui_scenario : String?
      property labels : Array(String)
      property template_id : String?
      property template_slug : String?
      property template_author_profile_id : String?
      property template_author_username : String?
      property template_author_display_name : String?
      property template_pricing_mode : String?
      property template_pricing_value : Float64?
      property owner_profile_id : String?
      property owner_username : String?
      property owner_display_name : String?
      property actor_handle : String?
      property actor_did : String?
      property is_public_task : Bool
      property vcs_enabled : Bool
      property document_json : String?
      property attachment_json : String?

      def initialize(
        @id : String,
        @status : String,
        @solver : String,
        @title : String,
        @description : String? = nil,
        @estimated_cost : Float64? = nil,
        @currency : String = "USDC",
        @execution_estimate : String? = nil,
        @created_at : String = Time.utc.to_rfc3339,
        @updated_at : String = Time.utc.to_rfc3339,
        @payment_url : String? = nil,
        @ui_scenario : String? = nil,
        @labels : Array(String) = [] of String,
        @template_id : String? = nil,
        @template_slug : String? = nil,
        @template_author_profile_id : String? = nil,
        @template_author_username : String? = nil,
        @template_author_display_name : String? = nil,
        @template_pricing_mode : String? = nil,
        @template_pricing_value : Float64? = nil,
        @owner_profile_id : String? = nil,
        @owner_username : String? = nil,
        @owner_display_name : String? = nil,
        @actor_handle : String? = nil,
        @actor_did : String? = nil,
        @is_public_task : Bool = false,
        @vcs_enabled : Bool = false,
        @document_json : String? = nil,
        @attachment_json : String? = nil,
        @solver_name : String? = nil,
        @solver_handle : String? = nil,
        @solver_profile_url : String? = nil
      )
      end
    end

    module Error
      class InvalidActivity < Exception
      end
    end

    class BadRequest < Exception
    end

    class DeliveryFailed < Exception
    end

    SOLVERS = [
      "Neutron Solver",
      "Lumen Crew",
      "Pulse Engine",
      "Arcane Agents",
      "Northline Solver",
      "Ozon Runner",
    ]

    @@db : DB::Database? = nil
    @@db_lock = Mutex.new
    @@lock = Mutex.new
    @@ready = false

    private def self.setup(config : Utils::Config) : Nil
      db = database(config)
      return if @@ready

      @@db_lock.synchronize do
        unless @@ready
          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS orders (
              id TEXT PRIMARY KEY,
              status TEXT NOT NULL,
              solver TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              estimated_cost TEXT,
              currency TEXT NOT NULL,
              execution_estimate TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              payment_url TEXT,
              ui_scenario TEXT,
              labels_json TEXT NOT NULL DEFAULT '[]',
              template_id TEXT,
              template_slug TEXT,
              template_author_profile_id TEXT,
              template_author_username TEXT,
              template_author_display_name TEXT,
              template_pricing_mode TEXT,
              template_pricing_value TEXT,
              owner_profile_id TEXT,
              owner_username TEXT,
              owner_display_name TEXT,
              actor_handle TEXT,
              actor_did TEXT,
              is_public_task BOOLEAN NOT NULL DEFAULT FALSE,
              vcs_enabled BOOLEAN NOT NULL DEFAULT FALSE,
              document_json TEXT,
              attachment_json TEXT,
              solver_name TEXT,
              solver_handle TEXT,
              solver_profile_url TEXT
            )
          SQL

          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_id TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_slug TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_author_profile_id TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_author_username TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_author_display_name TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_pricing_mode TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_pricing_value TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_profile_id TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_username TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_display_name TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS actor_handle TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS actor_did TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_public_task BOOLEAN NOT NULL DEFAULT FALSE"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS vcs_enabled BOOLEAN NOT NULL DEFAULT FALSE"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS document_json TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS attachment_json TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS solver_name TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS solver_handle TEXT"
          db.exec "ALTER TABLE orders ADD COLUMN IF NOT EXISTS solver_profile_url TEXT"

          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS order_activities (
              seq BIGSERIAL PRIMARY KEY,
              activity_id TEXT NOT NULL,
              order_id TEXT NOT NULL,
              activity_json TEXT NOT NULL,
              published_at TEXT NOT NULL
            )
          SQL

          db.exec "CREATE INDEX IF NOT EXISTS idx_order_activities_order_id ON order_activities(order_id)"
          db.exec "CREATE INDEX IF NOT EXISTS idx_order_activities_seq_desc ON order_activities(seq DESC)"

          @@ready = true
        end
      end
    end

    private def self.database(config : Utils::Config) : DB::Database
      @@db_lock.synchronize do
        @@db ||= DB.open(config.database_url)
      end
    end

    private def self.current_time
      Time.utc.to_rfc3339
    end

    private def self.next_solver(config : Utils::Config, fallback_name : String) : {String, String?, String?, String?}
      solver_info = SolverFetcher.fetch_available_solver(config)

      if solver_info
        return {
          solver_info.name,
          solver_info.handle,
          solver_info.profile_url,
          solver_info.id
        }
      end

      name = SOLVERS[Random.rand(SOLVERS.size)]
      handle = "@#{name.downcase.gsub(/[^a-z0-9]+/, '-')}"
      {name, handle, nil, nil}
    end

    private def self.to_string(value : JSON::Any?)
      value.try(&.as_s?)
    end

    private def self.to_float(value : JSON::Any?)
      return nil unless value

      value.as_f? || value.as_i64?.try(&.to_f) || value.as_s?.try(&.to_f?)
    end

    private def self.to_bool(value : JSON::Any?) : Bool?
      return nil unless value

      value.as_bool? || value.as_s?.try do |string_value|
        normalized = string_value.strip.downcase
        next true if {"true", "1", "yes", "on"}.includes?(normalized)
        next false if {"false", "0", "no", "off"}.includes?(normalized)
        nil
      end
    end

    private def self.serialize_labels(labels : Array(String)) : String
      labels.to_json
    end

    private def self.deserialize_labels(value : String?) : Array(String)
      return [] of String if value.nil? || value.empty?

      JSON.parse(value).as_a.compact_map(&.as_s?)
    rescue
      [] of String
    end

    private def self.parse_estimated_cost(value : String?) : Float64?
      value.try(&.to_f?)
    end

    private def self.normalize_attachment_json(value : JSON::Any?) : String?
      attachments = value.try(&.as_a?)
      return nil unless attachments

      normalized = attachments.compact_map do |item|
        item.as_h? ? JSON.parse(item.to_json) : nil
      end
      return nil if normalized.empty?

      normalized.to_json
    end

    private def self.deserialize_attachments(value : String?) : Array(JSON::Any)
      return [] of JSON::Any if value.nil? || value.empty?

      JSON.parse(value).as_a
    rescue
      [] of JSON::Any
    end

    private def self.extract_uuid(value : String?) : String?
      return nil unless value

      normalized = value.strip
      return normalized if uuid?(normalized)

      match = normalized.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
      match ? match[0] : nil
    end

    private def self.uuid?(value : String) : Bool
      !!(value =~ /\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i)
    end

    private def self.normalize_did_key(value : String?) : String?
      return nil unless value

      normalized = value.strip
      return nil if normalized.empty?
      return normalized if normalized.starts_with?("http://") || normalized.starts_with?("https://")
      return normalized if normalized.starts_with?("did:key:")

      "did:key:#{normalized}"
    end

    private def self.system_actor_did(config : Utils::Config) : String
      config.actor_id
    end

    private def self.order_actor_did(order : OrderRecord, config : Utils::Config) : String
      actor_handle = normalize_actor_handle(order.actor_handle || order.owner_username)
      return "#{config.crater_url}/actor/#{actor_handle}" if actor_handle

      normalize_did_key(order.actor_did) || system_actor_did(config)
    end

    private def self.order_object_id(order : OrderRecord, config : Utils::Config) : String
      order.id
    end

    private def self.build_default_document_json(title : String, description : String?) : String
      content = description.to_s.strip
      content = title.strip if content.empty?

      {
        "format" => "markdown",
        "content" => content,
      }.to_json
    end

    private def self.normalize_document_json(value : JSON::Any?, title : String, description : String?) : String
      return build_default_document_json(title, description) unless value

      if object = value.as_h?
        content = to_string(object["content"]?) || description.to_s
        format = to_string(object["format"]?) || "markdown"
        return {
          "format" => format,
          "content" => content,
        }.to_json
      end

      content = to_string(value) || description.to_s
      build_default_document_json(title, content)
    end

    private def self.document_content(order : OrderRecord) : String
      raw = order.document_json
      return "" unless raw

      parsed = JSON.parse(raw).as_h?
      to_string(parsed.try(&.["content"]?)).to_s
    rescue
      ""
    end

    private def self.extract_node_comment(content : String, node_key : String) : String?
      return nil if content.empty? || node_key.empty?

      lines = content.gsub("\r\n", "\n").gsub('\r', '\n').split('\n')
      comments = [] of String
      index = 0

      while index < lines.size
        line = lines[index]? || ""
        match = line.match(/^#\+begin_node_comment:\s+(.+)$/i)
        unless match
          index += 1
          next
        end

        current_key = match[1]?.to_s.strip
        index += 1
        buffer = [] of String

        while index < lines.size && !(lines[index]? || "").strip.matches?(/^#\+end_node_comment\b/i)
          buffer << (lines[index]? || "")
          index += 1
        end

        if current_key == node_key
          comment = buffer.join("\n").strip
          comments << comment unless comment.empty?
        end

        index += 1
      end

      comments.last?
    end

    private def self.exchange_system_instruction(order : OrderRecord) : String?
      extract_node_comment(document_content(order), "#{order.id}-exchange-system-instruction")
    end

    private def self.routed_comment_payloads(order : OrderRecord) : Array(JSON::Any)
      content = document_content(order)
      return [] of JSON::Any if content.empty?

      lines = content.gsub("\r\n", "\n").gsub('\r', '\n').split('\n')
      payloads = [] of JSON::Any
      index = 0

      while index < lines.size
        line = lines[index]? || ""
        match = line.match(/^#\+begin_node_comment:\s+(.+)$/i)
        unless match
          index += 1
          next
        end

        node_key = match[1]?.to_s.strip
        index += 1
        buffer = [] of String

        while index < lines.size && !(lines[index]? || "").strip.matches?(/^#\+end_node_comment\b/i)
          buffer << (lines[index]? || "")
          index += 1
        end

        raw_comment = buffer.join("\n").strip
        begin
          parsed = JSON.parse(raw_comment).as_h?
          content_value = to_string(parsed.try(&.["content"]?))
          mentions = parsed.try(&.["mentions"]?).try(&.as_a?)
          if parsed && content_value && mentions
            mention_payloads = mentions.compact_map do |mention|
              object = mention.as_h?
              value = to_string(object.try(&.["value"]?))
              kind = to_string(object.try(&.["kind"]?))
              target_kind = to_string(object.try(&.["targetKind"]?))
              next nil unless value && kind

              JSON.parse(
                {
                  "value" => value,
                  "kind" => kind,
                  "targetKind" => target_kind,
                }.to_json
              )
            end

            if mention_payloads.size > 0
              payloads << JSON.parse(
                {
                  "nodeKey" => node_key,
                  "content" => content_value,
                  "mentions" => mention_payloads,
                }.to_json
              )
            end
          end
        rescue
        end

        index += 1
      end

      payloads
    end

    private def self.persist_order(record : OrderRecord, config : Utils::Config) : Nil
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO orders (
            id, status, solver, title, description, estimated_cost, currency, execution_estimate,
            created_at, updated_at, payment_url, ui_scenario, labels_json,
            template_id, template_slug, template_author_profile_id, template_author_username,
            template_author_display_name, template_pricing_mode, template_pricing_value,
            owner_profile_id, owner_username, owner_display_name, actor_handle, actor_did,
            is_public_task, vcs_enabled, document_json, attachment_json, solver_name, solver_handle, solver_profile_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            solver = EXCLUDED.solver,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            estimated_cost = EXCLUDED.estimated_cost,
            currency = EXCLUDED.currency,
            execution_estimate = EXCLUDED.execution_estimate,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            payment_url = EXCLUDED.payment_url,
            ui_scenario = EXCLUDED.ui_scenario,
            labels_json = EXCLUDED.labels_json,
            template_id = EXCLUDED.template_id,
            template_slug = EXCLUDED.template_slug,
            template_author_profile_id = EXCLUDED.template_author_profile_id,
            template_author_username = EXCLUDED.template_author_username,
            template_author_display_name = EXCLUDED.template_author_display_name,
            template_pricing_mode = EXCLUDED.template_pricing_mode,
            template_pricing_value = EXCLUDED.template_pricing_value,
            owner_profile_id = EXCLUDED.owner_profile_id,
            owner_username = EXCLUDED.owner_username,
            owner_display_name = EXCLUDED.owner_display_name,
            actor_handle = EXCLUDED.actor_handle,
            actor_did = EXCLUDED.actor_did,
            is_public_task = EXCLUDED.is_public_task,
            vcs_enabled = EXCLUDED.vcs_enabled,
            document_json = EXCLUDED.document_json,
            attachment_json = EXCLUDED.attachment_json,
            solver_name = EXCLUDED.solver_name,
            solver_handle = EXCLUDED.solver_handle,
            solver_profile_url = EXCLUDED.solver_profile_url
        SQL
        record.id,
        record.status,
        record.solver,
        record.title,
        record.description,
        record.estimated_cost.try(&.to_s),
        record.currency,
        record.execution_estimate,
        record.created_at,
        record.updated_at,
        record.payment_url,
        record.ui_scenario,
        serialize_labels(record.labels),
        record.template_id,
        record.template_slug,
        record.template_author_profile_id,
        record.template_author_username,
        record.template_author_display_name,
        record.template_pricing_mode,
        record.template_pricing_value.try(&.to_s),
        record.owner_profile_id,
        record.owner_username,
        record.owner_display_name,
        record.actor_handle,
        record.actor_did,
        record.is_public_task,
        record.vcs_enabled,
        record.document_json,
        record.attachment_json,
        record.solver_name,
        record.solver_handle,
        record.solver_profile_url
      )
    end

    private def self.merge_existing_order_state(record : OrderRecord, config : Utils::Config) : OrderRecord
      existing = find_order(record.id, config)
      return record unless existing

      record.owner_profile_id ||= existing.owner_profile_id
      record.owner_username ||= existing.owner_username
      record.owner_display_name ||= existing.owner_display_name
      record.actor_handle ||= existing.actor_handle
      record.actor_did ||= existing.actor_did
      record.template_id ||= existing.template_id
      record.template_slug ||= existing.template_slug
      record.template_author_profile_id ||= existing.template_author_profile_id
      record.template_author_username ||= existing.template_author_username
      record.template_author_display_name ||= existing.template_author_display_name
      record.template_pricing_mode ||= existing.template_pricing_mode
      record.template_pricing_value ||= existing.template_pricing_value
      record.document_json ||= existing.document_json
      record.attachment_json ||= existing.attachment_json
      record.payment_url ||= existing.payment_url
      record.ui_scenario ||= existing.ui_scenario

      if !record.is_public_task && existing.is_public_task
        record.is_public_task = true
      end
      if config.repositories_enabled && !record.vcs_enabled && existing.vcs_enabled
        record.vcs_enabled = true
      end
      if record.labels.empty? && !existing.labels.empty?
        record.labels = existing.labels
      end

      record
    end

    private def self.persist_activity(activity : JSON::Any, order_id : String, config : Utils::Config) : Nil
      setup(config)
      activity_hash = activity.as_h?
      activity_id = activity_hash.try { |hash| to_string(hash["id"]?) } || UUID.random.to_s
      published_at = activity_hash.try { |hash| to_string(hash["published"]?) } || current_time

      database(config).exec(
        "INSERT INTO order_activities (activity_id, order_id, activity_json, published_at) VALUES ($1, $2, $3, $4)",
        activity_id,
        order_id,
        activity.to_json,
        published_at
      )
    end

    private def self.hydrate_order(row : {String, String, String, String, String?, String?, String, String?, String, String, String?, String?, String, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, Bool, Bool, String?, String?, String?, String?, String?}) : OrderRecord
      OrderRecord.new(
        id: row[0],
        status: row[1],
        solver: row[2],
        title: row[3],
        description: row[4],
        estimated_cost: parse_estimated_cost(row[5]),
        currency: row[6],
        execution_estimate: row[7],
        created_at: row[8],
        updated_at: row[9],
        payment_url: row[10],
        ui_scenario: row[11],
        labels: deserialize_labels(row[12]),
        template_id: row[13],
        template_slug: row[14],
        template_author_profile_id: row[15],
        template_author_username: row[16],
        template_author_display_name: row[17],
        template_pricing_mode: row[18],
        template_pricing_value: parse_estimated_cost(row[19]),
        owner_profile_id: row[20],
        owner_username: row[21],
        owner_display_name: row[22],
        actor_handle: row[23],
        actor_did: row[24],
        is_public_task: row[25],
        vcs_enabled: row[26],
        document_json: row[27],
        attachment_json: row[28],
        solver_name: row[29],
        solver_handle: row[30],
        solver_profile_url: row[31]
      )
    end

    private def self.payment_link_payload(payload : Hash(String, JSON::Any)) : Hash(String, JSON::Any)?
      attachment_items = payload["attachment"]?.try(&.as_a?) || [] of JSON::Any

      attachment_items.each do |item|
        candidate = item.as_h?
        next unless candidate

        type = to_string(candidate["type"]?)
        rel = candidate["rel"]?
        rel_values = rel.try(&.as_a?).try(&.compact_map(&.as_s?)) || [] of String
        rel_value = rel.try(&.as_s?)

        next unless type == "PaymentLink" || rel_values.any? { |value| value.includes?("payment") || value.includes?("price") } || rel_value == "payment" || rel_value == "price"
        return candidate
      end

      nil
    end

    private def self.parse_order_payload(payload : JSON::Any, config : Utils::Config) : OrderRecord
      object_payload = payload.as_h? || {} of String => JSON::Any
      parse_order_payload_from_map(object_payload, config)
    end

    private def self.parse_order_payload(activity : Aptok::Vocab::Activity, config : Utils::Config) : OrderRecord
      parse_order_payload_from_map(AptokPayload.activity_object(activity).as_h? || {} of String => JSON::Any, config)
    end

    private def self.ticket_payload(payload : Hash(String, JSON::Any)) : Hash(String, JSON::Any)?
      if to_string(payload["type"]?) == "Offer"
        %w[object offeredItem ticket target].each do |key|
          nested = payload[key]?
          nested_map = nested.as_h? if nested
          next unless nested_map
          return nested_map if to_string(nested_map["type"]?) == "Ticket"
        end
      end

      nil
    end

    private def self.parse_order_payload_from_map(payload : Hash(String, JSON::Any), config : Utils::Config) : OrderRecord
      ticket = ticket_payload(payload)
      source = ticket || payload
      payment_link = payment_link_payload(payload) || payment_link_payload(source)
      ui_scenario = to_string(payload["uiScenario"]?) || to_string(source["uiScenario"]?)
      labels = parse_labels(payload, source)

      raw_status = to_string(payload["status"]?) || to_string(source["status"]?)
      status = raw_status && !raw_status.empty? ? raw_status : "queued"

      actor_handle = normalize_actor_handle(to_string(payload["actorHandle"]?) || to_string(source["actorHandle"]?) || to_string(payload["ownerUsername"]?) || to_string(source["ownerUsername"]?))
      owner_username = to_string(payload["ownerUsername"]?) || to_string(source["ownerUsername"]?) || actor_handle
      generated_id = UUID.random.to_s
      id = extract_uuid(to_string(payload["id"]?) || to_string(source["id"]?)) || generated_id
      title = to_string(payload["name"]?) || to_string(payload["title"]?) || to_string(source["name"]?) || to_string(source["title"]?) || "Untitled order"
      description = to_string(payload["content"]?) || to_string(payload["description"]?) || to_string(source["content"]?) || to_string(source["description"]?) || ""
      estimated_cost = to_float(payment_link.try(&.["price"]?)) || to_float(payment_link.try(&.["amount"]?)) || to_float(payload["estimatedCost"]?) || to_float(payload["price"]?) || to_float(source["estimatedCost"]?) || to_float(source["price"]?) || 0.0
      template_pricing_value = to_float(payload["templatePricingValue"]?) || to_float(source["templatePricingValue"]?)
      execution_estimate = to_string(payload["executionEstimate"]?) || to_string(payload["dueDate"]?) || to_string(source["executionEstimate"]?) || to_string(source["dueDate"]?)
      currency = to_string(payment_link.try(&.["currency"]?)) || to_string(payload["currency"]?) || to_string(source["currency"]?) || "USDC"
      payment_url = to_string(payment_link.try(&.["href"]?)) || to_string(payment_link.try(&.["url"]?))
      is_vpn_order = vpn_service_payload?(title, description, ui_scenario, labels)
      labels = ensure_vpn_label(labels) if is_vpn_order
      is_public_task = to_bool(payload["isPublicTask"]?) || to_bool(source["isPublicTask"]?) || false
      vcs_enabled = config.repositories_enabled && (to_bool(payload["vcsEnabled"]?) || to_bool(source["vcsEnabled"]?) || false)

      explicit_solver_name = to_string(payload["solverName"]?) || to_string(source["solverName"]?) || to_string(payload["solver"]?) || to_string(source["solver"]?)
      explicit_solver_handle = to_string(payload["solverHandle"]?) || to_string(source["solverHandle"]?) || to_string(payload["performerHandle"]?) || to_string(source["performerHandle"]?)
      explicit_solver_profile_url = to_string(payload["solverProfileUrl"]?) || to_string(source["solverProfileUrl"]?) || to_string(payload["performerProfileUrl"]?) || to_string(source["performerProfileUrl"]?)

      solver_name = explicit_solver_name
      solver_handle = explicit_solver_handle
      solver_profile_url = explicit_solver_profile_url
      solver_label = explicit_solver_name || ""

      OrderRecord.new(
        id: id,
        status: status,
        solver: solver_label,
        title: title,
        description: description,
        estimated_cost: is_vpn_order ? (estimated_cost > 0 ? estimated_cost : 2.0) : estimated_cost,
        currency: is_vpn_order ? (currency.empty? ? "USD" : currency) : currency,
        execution_estimate: is_vpn_order ? "about 25 minutes" : execution_estimate,
        payment_url: payment_url,
        ui_scenario: is_vpn_order ? "vpn-service" : ui_scenario,
        labels: labels,
        template_id: to_string(payload["templateId"]?) || to_string(source["templateId"]?),
        template_slug: to_string(payload["templateSlug"]?) || to_string(source["templateSlug"]?),
        template_author_profile_id: to_string(payload["templateAuthorProfileId"]?) || to_string(source["templateAuthorProfileId"]?),
        template_author_username: to_string(payload["templateAuthorUsername"]?) || to_string(source["templateAuthorUsername"]?),
        template_author_display_name: to_string(payload["templateAuthorDisplayName"]?) || to_string(source["templateAuthorDisplayName"]?),
        template_pricing_mode: to_string(payload["templatePricingMode"]?) || to_string(source["templatePricingMode"]?),
        template_pricing_value: template_pricing_value,
        owner_profile_id: to_string(payload["ownerProfileId"]?) || to_string(source["ownerProfileId"]?),
        owner_username: owner_username,
        owner_display_name: to_string(payload["ownerDisplayName"]?) || to_string(source["ownerDisplayName"]?),
        actor_handle: actor_handle,
        actor_did: normalize_did_key(to_string(payload["actorDid"]?) || to_string(source["actorDid"]?)) || system_actor_did(config),
        is_public_task: is_public_task,
        vcs_enabled: vcs_enabled,
        document_json: normalize_document_json(payload["document"]? || source["document"]?, title, description),
        attachment_json: normalize_attachment_json(payload["attachment"]? || source["attachment"]?),
        solver_name: solver_name,
        solver_handle: solver_handle,
        solver_profile_url: solver_profile_url
      )
    end

    private def self.vpn_service_payload?(title : String, description : String, ui_scenario : String?, labels : Array(String)) : Bool
      return true if ui_scenario == "vpn-service"
      return true if labels.any? { |label| label.downcase.includes?("vpn") }

      normalized = "#{title} #{description}".downcase
      normalized.includes?("vpn")
    end

    private def self.parse_labels(payload : Hash(String, JSON::Any), source : Hash(String, JSON::Any)) : Array(String)
      values = [] of String

      [payload["labels"]?, source["labels"]?].each do |candidate|
        next unless candidate

        if array = candidate.as_a?
          array.each do |item|
            if label = item.as_s?
              normalized = label.strip
              values << normalized unless normalized.empty?
            end
          end
        elsif label = candidate.as_s?
          normalized = label.strip
          values << normalized unless normalized.empty?
        end
      end

      values.uniq
    end

    private def self.ensure_vpn_label(labels : Array(String)) : Array(String)
      return labels if labels.any? { |label| label.downcase == "vpn" }

      labels + ["vpn"]
    end

    def self.activity_object(order : OrderRecord, status : String, config : Utils::Config) : JSON::Any
      object_id = order_object_id(order, config)
      actor_did = order_actor_did(order, config)
      attachments = combined_attachments(order, status, config)
      system_instruction = exchange_system_instruction(order)
      routed_comments = routed_comment_payloads(order)
      vcs_enabled = config.repositories_enabled && order.vcs_enabled
      ticket_payload = {
        "@context" => [ActivityPub::CONTEXT, ForgeFed::CONTEXT],
        "id" => "#{object_id}/ticket",
        "orderId" => order.id,
        "type" => "Ticket",
        "name" => order.title,
        "content" => order.description,
        "status" => status,
        "reporter" => actor_did,
        "labels" => order.labels,
        "estimatedCost" => order.estimated_cost,
        "currency" => order.currency,
        "executionEstimate" => order.execution_estimate,
        "templateId" => order.template_id,
        "templateSlug" => order.template_slug,
        "templateAuthorProfileId" => order.template_author_profile_id,
        "templateAuthorUsername" => order.template_author_username,
        "templateAuthorDisplayName" => order.template_author_display_name,
        "templatePricingMode" => order.template_pricing_mode,
        "templatePricingValue" => order.template_pricing_value,
        "ownerProfileId" => order.owner_profile_id,
        "ownerUsername" => order.owner_username,
        "ownerDisplayName" => order.owner_display_name,
        "actorHandle" => order.actor_handle,
        "actorDid" => actor_did,
        "isPublicTask" => order.is_public_task,
        "vcsEnabled" => vcs_enabled,
        "document" => JSON.parse(order.document_json || build_default_document_json(order.title, order.description)),
        "attachment" => attachments
      }
      ticket_payload["systemInstruction"] = JSON::Any.new(system_instruction) if system_instruction
      ticket_payload["commentRoutes"] = JSON.parse(routed_comments.to_json) if routed_comments.size > 0

      object_payload = {
        "@context" => [
          ActivityPub::CONTEXT,
          ForgeFed::CONTEXT,
          "https://w3id.org/fep/0ea0",
        ],
        "id" => object_id,
        "orderId" => order.id,
        "type" => "Offer",
        "name" => order.title,
        "content" => order.description,
        "object" => JSON.parse(ticket_payload.to_json),
        "status" => status,
        "solver" => order.solver,
        "estimatedCost" => order.estimated_cost,
        "currency" => order.currency,
        "executionEstimate" => order.execution_estimate,
        "uiScenario" => order.ui_scenario,
        "labels" => order.labels,
        "published" => order.updated_at,
        "templateId" => order.template_id,
        "templateSlug" => order.template_slug,
        "templateAuthorProfileId" => order.template_author_profile_id,
        "templateAuthorUsername" => order.template_author_username,
        "templateAuthorDisplayName" => order.template_author_display_name,
        "templatePricingMode" => order.template_pricing_mode,
        "templatePricingValue" => order.template_pricing_value,
        "ownerProfileId" => order.owner_profile_id,
        "ownerUsername" => order.owner_username,
        "ownerDisplayName" => order.owner_display_name,
        "actorHandle" => order.actor_handle,
        "actorDid" => actor_did,
        "isPublicTask" => order.is_public_task,
        "vcsEnabled" => vcs_enabled,
        "document" => JSON.parse(order.document_json || build_default_document_json(order.title, order.description)),
        "attachment" => attachments
      }
      object_payload["systemInstruction"] = JSON::Any.new(system_instruction) if system_instruction
      object_payload["commentRoutes"] = JSON.parse(routed_comments.to_json) if routed_comments.size > 0

      JSON.parse(object_payload.to_json)
    end

    private def self.combined_attachments(order : OrderRecord, status : String, config : Utils::Config)
      attachments = deserialize_attachments(order.attachment_json)
      attachments.concat(result_attachments(order, status, config))
      attachments
    end

    private def self.result_attachments(order : OrderRecord, status : String, config : Utils::Config)
      attachments = [] of JSON::Any

      if status == "completed" && order.ui_scenario == "vpn-service"
        attachments << JSON.parse(vpn_delivery_attachment(order, config).to_json)
      end

      attachments
    end

    private def self.vpn_delivery_attachment(order : OrderRecord, config : Utils::Config)
      vless_uri = "vless://32274730-3454-49e3-b2d9-e6adf153b176@provider.akashprovid.com:32701?encryption=none&flow=xtls-rprx-vision&fp=chrome&pbk=1Lj8mfaT2j_ScjZvTQmAhFrsy9rdmFpNTObdhZxoJzs&security=reality&sid=ea392ae8&sni=github.com&type=tcp#UsServer1"

      {
        "@context" => ActivityPub::CONTEXT,
        "id" => "#{order.id}/delivery",
        "type" => "Article",
        "name" => "VPN delivery package",
        "summary" => "Structured VPN connection package and setup guide.",
        "mediaType" => "text/markdown",
        "attributedTo" => order_actor_did(order, config),
        "url" => "/vless-us1.jsonc",
        "content" => "Provisioned VLESS access package with client setup steps for mobile and desktop.",
        "generator" => {
          "type" => "Service",
          "name" => "Crater"
        },
        "tag" => ["vpn", "vless", "delivery"],
        "attachment" => [
          {
            "type" => "Link",
            "name" => "VLESS profile",
            "href" => vless_uri
          },
          {
            "type" => "Link",
            "name" => "Config file",
            "href" => "/vless-us1.jsonc"
          },
          {
            "type" => "Article",
            "position" => 1,
            "name" => "Android setup",
            "content" => "Install Exclave or v2rayNG, import the VLESS URI, confirm the UsServer1 profile, then connect and verify the new IP."
          },
          {
            "type" => "Article",
            "position" => 2,
            "name" => "iOS setup",
            "content" => "Open Shadowrocket or Stash, import the VLESS URI from clipboard or URL, approve the VPN profile, then connect."
          },
          {
            "type" => "Article",
            "position" => 3,
            "name" => "Desktop setup",
            "content" => "Use v2rayN on Windows, V2RayU on macOS, or NekoBox on Linux. Import the same VLESS URI, select UsServer1, and enable system proxy if required."
          },
          {
            "type" => "Article",
            "position" => 4,
            "name" => "Verification",
            "content" => "After connection, open whatismyip.com or run curl ifconfig.me to verify that traffic is routed through the provisioned endpoint."
          }
        ]
      }
    end

    def self.activity_for(order : OrderRecord, status : String, config : Utils::Config) : JSON::Any
      activity_payload = {
        "@context" => [
          ActivityPub::CONTEXT,
          ForgeFed::CONTEXT,
          "https://w3id.org/fep/0ea0"
        ],
        "id" => UUID.random.to_s,
        "type" => status == "queued" ? "Create" : "Update",
        "actor" => order_actor_did(order, config),
        "object" => activity_object(order, status, config),
        "to" => [
          "https://www.w3.org/ns/activitystreams#Public"
        ],
        "published" => current_time
      }

      JSON.parse(activity.to_json)
    end

    def self.activity_for_payload(payload : JSON::Any, config : Utils::Config) : ActivityPub::Activity
      raise BadRequest.new("Payload must be JSON object") unless payload.as_h?

      record = parse_order_payload(payload, config)
      ActivityPub::Activity.from_json(activity_for(record, record.status, config).to_json)
    end

    private def self.post_to_exchange_inbox(activity : ActivityPub::Activity, config : Utils::Config) : Nil
      inbox_url = config.order_queue_inbox
      Log.info { "[order_queue:deliver] posting activity=#{activity.type} id=#{activity.id} to=#{inbox_url}" }
      response = HTTP::Client.post(
        inbox_url,
        headers: HTTP::Headers{
          "Accept" => "application/activity+json, application/json",
          "Content-Type" => "application/activity+json"
        },
        body: activity.to_json,
        tls: inbox_url.starts_with?("https://")
      )

      return if response.status_code >= 200 && response.status_code < 300

      response_body = response.body.to_s.strip
      Log.warn { "[order_queue:deliver] exchange rejected activity=#{activity.id} status=#{response.status_code} body=#{response_body}" }
      reason = response_body.empty? ? "HTTP #{response.status_code}" : "HTTP #{response.status_code}: #{response_body}"
      raise DeliveryFailed.new("Exchange inbox rejected activity: #{reason}")
    rescue ex : DeliveryFailed
      raise ex
    rescue ex
      Log.error(exception: ex) { "[order_queue:deliver] failed activity=#{activity.id} to=#{inbox_url}" }
      raise DeliveryFailed.new("Failed to deliver activity to exchange inbox: #{ex.message}")
    end

    def self.receive_create(activity : ActivityPub::Activity, config : Utils::Config) : OrderRecord
      raise Error::InvalidActivity.new("Activity type must be Create") unless activity.type == "Create"

      record = parse_order_payload(activity, config)
      record = merge_existing_order_state(record, config)

      @@lock.synchronize do
        persist_order(record, config)
        persist_activity(JSON.parse(activity.to_json), record.id, config)
      end

      record
    end

    def self.submit_create(activity : ActivityPub::Activity, config : Utils::Config) : OrderRecord
      raise Error::InvalidActivity.new("Activity type must be Create") unless activity.type == "Create"

      record = parse_order_payload(activity, config)
      record = merge_existing_order_state(record, config)
      Log.info { "[order_queue:submit_create] parsed id=#{record.id} status=#{record.status} title=#{record.title.inspect}" }

      @@lock.synchronize do
        persist_order(record, config)
        persist_activity(JSON.parse(activity.to_json), record.id, config)
      end
      Log.info { "[order_queue:submit_create] persisted id=#{record.id} status=#{record.status}" }

      # Do not block the create response on exchange availability.
      spawn do
        begin
          post_to_exchange_inbox(activity, config)
          Log.info { "[order_queue:submit_create] delivered id=#{record.id} activity=#{activity.id}" }
        rescue ex
          Log.error { "[order_queue:submit_create] delivery failed id=#{record.id}: #{ex.message}" }
          STDERR.puts "Failed to deliver order #{record.id} to exchange: #{ex.message}"
        end
      end

      record
    end

    def self.submit_update(activity : ActivityPub::Activity, config : Utils::Config) : OrderRecord
      raise Error::InvalidActivity.new("Activity type must be Update") unless activity.type == "Update"

      record = parse_order_payload(activity, config)
      record = merge_existing_order_state(record, config)

      @@lock.synchronize do
        persist_order(record, config)
        persist_activity(JSON.parse(activity.to_json), record.id, config)
      end

      record
    end

    def self.submit_rest(payload : JSON::Any, config : Utils::Config) : OrderRecord
      submit_create(activity_for_payload(payload, config), config)
    end

    def self.transition(order_id : String, status : String, config : Utils::Config)
      @@lock.synchronize do
        record = find_order(order_id, config)
        next unless record

        record.status = status
        record.updated_at = current_time
        persist_order(record, config)
        persist_activity(activity_for(record, record.status, config), record.id, config)
      end
    end

    def self.find_order(order_id : String, config : Utils::Config = Utils::Config.load) : OrderRecord?
      setup(config)
      normalized_id = order_id.strip
      uuid = extract_uuid(normalized_id)
      row = if uuid
              database(config).query_one?(
                "SELECT id, status, solver, title, description, estimated_cost, currency, execution_estimate, created_at, updated_at, payment_url, ui_scenario, labels_json, template_id, template_slug, template_author_profile_id, template_author_username, template_author_display_name, template_pricing_mode, template_pricing_value, owner_profile_id, owner_username, owner_display_name, actor_handle, actor_did, is_public_task, vcs_enabled, document_json, attachment_json, solver_name, solver_handle, solver_profile_url FROM orders WHERE id = $1 OR id = $2 OR id LIKE $3 ORDER BY CASE WHEN id = $1 THEN 0 WHEN id = $2 THEN 1 ELSE 2 END LIMIT 1",
                normalized_id,
                uuid,
                "%/#{uuid}",
                as: {String, String, String, String, String?, String?, String, String?, String, String, String?, String?, String, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, Bool, Bool, String?, String?, String?, String?, String?}
              )
            else
              database(config).query_one?(
                "SELECT id, status, solver, title, description, estimated_cost, currency, execution_estimate, created_at, updated_at, payment_url, ui_scenario, labels_json, template_id, template_slug, template_author_profile_id, template_author_username, template_author_display_name, template_pricing_mode, template_pricing_value, owner_profile_id, owner_username, owner_display_name, actor_handle, actor_did, is_public_task, vcs_enabled, document_json, attachment_json, solver_name, solver_handle, solver_profile_url FROM orders WHERE id = $1",
                normalized_id,
                as: {String, String, String, String, String?, String?, String, String?, String, String, String?, String?, String, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, String?, Bool, Bool, String?, String?, String?, String?, String?}
              )
            end
      return nil unless row

      hydrate_order(row)
    end

    def self.total_items(config : Utils::Config = Utils::Config.load)
      setup(config)
      database(config).query_one("SELECT COUNT(*) FROM order_activities", as: Int64).to_i
    end

    def self.activity_page(page : Int32, config : Utils::Config = Utils::Config.load) : Array(JSON::Any)
      return [] of JSON::Any if page < 1

      setup(config)
      start = (page - 1) * EVENT_PAGE_SIZE
      rows = database(config).query_all(
        "SELECT activity_json FROM order_activities ORDER BY seq DESC LIMIT $1 OFFSET $2",
        EVENT_PAGE_SIZE,
        start,
        as: String
      )

      rows.compact_map do |row|
        JSON.parse(row)
      rescue
        nil
      end
    end

    def self.total_items_for_actor(actor_uri : String, config : Utils::Config = Utils::Config.load) : Int32
      setup(config)
      database(config).query_all(
        "SELECT activity_json FROM order_activities ORDER BY seq DESC",
        as: String
      ).count do |row|
        begin
          JSON.parse(row).as_h?.try { |activity| to_string(activity["actor"]?) == actor_uri } == true
        rescue
          false
        end
      end
    end

    def self.activity_page_for_actor(actor_uri : String, page : Int32, config : Utils::Config = Utils::Config.load) : Array(JSON::Any)
      return [] of JSON::Any if page < 1

      all = database(config).query_all(
        "SELECT activity_json FROM order_activities ORDER BY seq DESC",
        as: String
      ).compact_map do |row|
        activity = JSON.parse(row)
        next nil unless activity.as_h?.try { |value| to_string(value["actor"]?) == actor_uri } == true

        activity
      rescue
        nil
      end

      start = (page - 1) * EVENT_PAGE_SIZE
      all[start, EVENT_PAGE_SIZE]? || [] of JSON::Any
    end

    def self.latest_by_order(order_id : String, config : Utils::Config = Utils::Config.load) : JSON::Any?
      setup(config)
      normalized_id = order_id.strip
      uuid = extract_uuid(normalized_id)
      row = if uuid
              database(config).query_one?(
                "SELECT activity_json FROM order_activities WHERE order_id = $1 OR order_id = $2 OR order_id LIKE $3 ORDER BY CASE WHEN order_id = $1 THEN 0 WHEN order_id = $2 THEN 1 ELSE 2 END, seq DESC LIMIT 1",
                normalized_id,
                uuid,
                "%/#{uuid}",
                as: String
              )
            else
              database(config).query_one?(
                "SELECT activity_json FROM order_activities WHERE order_id = $1 ORDER BY seq DESC LIMIT 1",
                normalized_id,
                as: String
              )
            end
      return nil unless row

      JSON.parse(row)
    rescue
      nil
    end

    def self.activities_for_order(order_id : String, config : Utils::Config = Utils::Config.load, limit : Int32 = EVENT_PAGE_SIZE) : Array(JSON::Any)
      setup(config)
      normalized_id = order_id.strip
      uuid = extract_uuid(normalized_id)
      rows = if uuid
               database(config).query_all(
                 "SELECT activity_json FROM order_activities WHERE order_id = $1 OR order_id = $2 OR order_id LIKE $3 ORDER BY seq ASC LIMIT $4",
                 normalized_id,
                 uuid,
                 "%/#{uuid}",
                 limit,
                 as: String
               )
             else
               database(config).query_all(
                 "SELECT activity_json FROM order_activities WHERE order_id = $1 ORDER BY seq ASC LIMIT $2",
                 normalized_id,
                 limit,
                 as: String
               )
             end

      rows.compact_map do |row|
        JSON.parse(row)
      rescue
        nil
      end
    end

    def self.update_document(order_id : String, document : JSON::Any, config : Utils::Config = Utils::Config.load) : OrderRecord?
      @@lock.synchronize do
        record = find_order(order_id, config)
        return nil unless record

        record.document_json = normalize_document_json(document, record.title, record.description)
        record.updated_at = current_time
        persist_order(record, config)

        persist_activity(
          JSON.parse(
            {
              "@context" => [ActivityPub::CONTEXT],
              "id" => UUID.random.to_s,
              "type" => "Update",
              "actor" => order_actor_did(record, config),
              "object" => {
                "id" => record.id,
                "type" => "Note",
                "document" => JSON.parse(record.document_json.not_nil!)
              },
              "published" => record.updated_at
            }.to_json
          ),
          record.id,
          config
        )

        outbound_update = ActivityPub::Activity.from_json(activity_for(record, record.status, config).to_json)
        spawn do
          begin
            post_to_exchange_inbox(outbound_update, config)
          rescue ex
            Log.error { "[order_queue:update_document] delivery failed id=#{record.id}: #{ex.message}" }
          end
        end

        record
      end
    end

    def self.update_settings(order_id : String, vcs_enabled : Bool?, is_public_task : Bool?, config : Utils::Config = Utils::Config.load) : OrderRecord?
      @@lock.synchronize do
        record = find_order(order_id, config)
        return nil unless record

        record.is_public_task = is_public_task.not_nil! unless is_public_task.nil?
        record.vcs_enabled = vcs_enabled.not_nil! unless vcs_enabled.nil?
        record.updated_at = current_time
        persist_order(record, config)
        record
      end
    end
    private def self.normalize_actor_handle(value : String?) : String?
      return nil unless value

      normalized = value.strip.gsub(/^@+/, "").downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
      normalized = normalized[0, 32] if normalized.size > 32
      normalized.empty? ? nil : normalized
    end
  end
end
