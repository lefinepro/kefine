require "db"
require "json"
require "mutex"
require "pg"
require "time"
require "uri"
require "uuid"

require "./activitypub/types"
require "./forgefed/types"
require "./utils/config"

module Crater
  module OrderQueue
    EVENT_PAGE_SIZE = 20

    class OrderRecord
      property id : String
      property status : String
      property solver : String
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
        @labels : Array(String) = [] of String
      )
      end
    end

    module Error
      class InvalidActivity < Exception
      end
    end

    class BadRequest < Exception
    end

    SOLVERS = [
      "Neutron Solver",
      "Lumen Crew",
      "Pulse Engine",
      "Arcane Agents",
      "Northline Solver",
      "Ozon Runner"
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
              labels_json TEXT NOT NULL DEFAULT '[]'
            )
          SQL

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

    private def self.next_solver
      SOLVERS[Random.rand(SOLVERS.size)]
    end

    private def self.to_string(value : JSON::Any?)
      value.try(&.as_s?)
    end

    private def self.to_float(value : JSON::Any?)
      return nil unless value

      value.as_f? || value.as_i64?.try(&.to_f) || value.as_s?.try(&.to_f?)
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

    private def self.persist_order(record : OrderRecord, config : Utils::Config) : Nil
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO orders (
            id, status, solver, title, description, estimated_cost, currency, execution_estimate,
            created_at, updated_at, payment_url, ui_scenario, labels_json
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
            labels_json = EXCLUDED.labels_json
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
        serialize_labels(record.labels)
      )
    end

    private def self.persist_activity(activity : JSON::Any, order_id : String, config : Utils::Config) : Nil
      setup(config)
      activity_hash = activity.as_h?
      activity_id = activity_hash.try { |hash| to_string(hash["id"]?) } || "#{config.actor_outbox}/activities/#{UUID.random}"
      published_at = activity_hash.try { |hash| to_string(hash["published"]?) } || current_time

      database(config).exec(
        "INSERT INTO order_activities (activity_id, order_id, activity_json, published_at) VALUES ($1, $2, $3, $4)",
        activity_id,
        order_id,
        activity.to_json,
        published_at
      )
    end

    private def self.hydrate_order(row : {String, String, String, String, String?, String?, String, String?, String, String, String?, String?, String}) : OrderRecord
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
        labels: deserialize_labels(row[12])
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

    private def self.parse_order_payload(activity : ActivityPub::Activity, config : Utils::Config) : OrderRecord
      parse_order_payload_from_map(activity.object.as_h? || {} of String => JSON::Any, config)
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

      id = to_string(payload["id"]?) || to_string(source["id"]?) || "#{config.actor_id}/orders/#{UUID.random}"
      title = to_string(payload["name"]?) || to_string(payload["title"]?) || to_string(source["name"]?) || to_string(source["title"]?) || "Untitled order"
      description = to_string(payload["content"]?) || to_string(payload["description"]?) || to_string(source["content"]?) || to_string(source["description"]?) || ""
      estimated_cost = to_float(payment_link.try(&.["price"]?)) || to_float(payment_link.try(&.["amount"]?)) || to_float(payload["estimatedCost"]?) || to_float(payload["price"]?) || to_float(source["estimatedCost"]?) || to_float(source["price"]?) || 0.0
      execution_estimate = to_string(payload["executionEstimate"]?) || to_string(payload["dueDate"]?) || to_string(source["executionEstimate"]?) || to_string(source["dueDate"]?)
      currency = to_string(payment_link.try(&.["currency"]?)) || to_string(payload["currency"]?) || to_string(source["currency"]?) || "USDC"
      payment_url = to_string(payment_link.try(&.["href"]?)) || to_string(payment_link.try(&.["url"]?))
      is_vpn_order = vpn_service_payload?(title, description, ui_scenario, labels)
      labels = ensure_vpn_label(labels) if is_vpn_order

      OrderRecord.new(
        id: id,
        status: status,
        solver: is_vpn_order ? "NordLayer Solver" : next_solver,
        title: title,
        description: description,
        estimated_cost: is_vpn_order ? (estimated_cost > 0 ? estimated_cost : 2.0) : estimated_cost,
        currency: is_vpn_order ? (currency.empty? ? "USD" : currency) : currency,
        execution_estimate: is_vpn_order ? "about 25 minutes" : execution_estimate,
        payment_url: is_vpn_order ? "#{config.exchange_url}/pay/#{URI.encode_path(id)}" : payment_url,
        ui_scenario: is_vpn_order ? "vpn-service" : ui_scenario,
        labels: labels
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
      ticket_payload = {
        "@context" => [ActivityPub::CONTEXT, ForgeFed::CONTEXT],
        "id" => "#{order.id}/ticket",
        "type" => "Ticket",
        "name" => order.title,
        "content" => order.description,
        "status" => status,
        "reporter" => config.actor_id,
        "labels" => order.labels,
        "estimatedCost" => order.estimated_cost,
        "currency" => order.currency,
        "executionEstimate" => order.execution_estimate
      }

      object_payload = {
        "@context" => [
          ActivityPub::CONTEXT,
          ForgeFed::CONTEXT,
          "https://w3id.org/fep/0ea0",
        ],
        "id" => order.id,
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
        "attachment" => payment_links(order, status, config)
      }

      JSON.parse(object_payload.to_json)
    end

    private def self.payment_links(order : OrderRecord, status : String, config : Utils::Config)
      payment = order.payment_url || "#{config.exchange_url}/pay/#{order.id}"
      payment_record = {
        "@context" => [ActivityPub::CONTEXT, ForgeFed::CONTEXT, "https://kefine.app/ns/payment"],
        "id" => "#{config.actor_outbox}/payment-links/#{order.id}",
        "type" => "PaymentLink",
        "name" => status == "completed" ? "Pay invoice" : "Solver price quote",
        "summary" => "Price published by the assigned solver",
        "attributedTo" => {
          "id" => "#{config.actor_id}/solvers/#{URI.encode_path(order.solver.downcase.gsub(' ', '-'))}",
          "type" => "Service",
          "name" => order.solver,
          "preferredUsername" => order.solver.downcase.gsub(/[^a-z0-9]+/, "-"),
          "inbox" => config.actor_inbox,
          "outbox" => config.actor_outbox,
        },
        "price" => order.estimated_cost,
        "amount" => order.estimated_cost,
        "currency" => order.currency,
        "rel" => ["payment", "price"],
        "href" => payment,
        "url" => payment,
        "mediaType" => "application/payment-link+json",
      }

      [JSON.parse(payment_record.to_json)]
    end

    def self.activity_for(order : OrderRecord, status : String, config : Utils::Config) : JSON::Any
      activity_payload = {
        "@context" => [
          ActivityPub::CONTEXT,
          ForgeFed::CONTEXT,
          "https://w3id.org/fep/0ea0"
        ],
        "id" => "#{config.actor_outbox}/activities/#{UUID.random}",
        "type" => status == "queued" ? "Create" : "Update",
        "actor" => config.actor_id,
        "object" => activity_object(order, status, config),
        "to" => [
          "https://www.w3.org/ns/activitystreams#Public"
        ],
        "published" => current_time
      }

      JSON.parse(activity_payload.to_json)
    end

    def self.submit_create(activity : ActivityPub::Activity, config : Utils::Config) : OrderRecord
      raise Error::InvalidActivity.new("Activity type must be Create") unless activity.type == "Create"

      record = parse_order_payload(activity, config)

      @@lock.synchronize do
        persist_order(record, config)
        persist_activity(activity_for(record, record.status, config), record.id, config)
      end

      spawn do
        sleep 3.seconds
        transition(record.id, "in_progress", config)
        sleep 3.seconds
        transition(record.id, "completed", config)
      end

      record
    end

    def self.submit_rest(payload : JSON::Any, config : Utils::Config) : OrderRecord
      raise BadRequest.new("Payload must be JSON object") unless payload.as_h?

      record = parse_order_payload(payload, config)

      @@lock.synchronize do
        persist_order(record, config)
        persist_activity(activity_for(record, record.status, config), record.id, config)
      end

      spawn do
        sleep 3.seconds
        transition(record.id, "in_progress", config)
        sleep 3.seconds
        transition(record.id, "completed", config)
      end

      record
    end

    def self.transition(order_id : String, status : String, config : Utils::Config)
      @@lock.synchronize do
        record = find_order(order_id, config)
        next unless record

        record.status = status
        record.updated_at = current_time
        record.payment_url = "#{config.exchange_url}/pay/#{record.id}" if status == "completed"

        persist_order(record, config)
        persist_activity(activity_for(record, record.status, config), record.id, config)
      end
    end

    def self.find_order(order_id : String, config : Utils::Config = Utils::Config.load) : OrderRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, status, solver, title, description, estimated_cost, currency, execution_estimate, created_at, updated_at, payment_url, ui_scenario, labels_json FROM orders WHERE id = $1",
        order_id,
        as: {String, String, String, String, String?, String?, String, String?, String, String, String?, String?, String}
      )
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

    def self.latest_by_order(order_id : String, config : Utils::Config = Utils::Config.load) : JSON::Any?
      setup(config)
      row = database(config).query_one?(
        "SELECT activity_json FROM order_activities WHERE order_id = $1 ORDER BY seq DESC LIMIT 1",
        order_id,
        as: String
      )
      return nil unless row

      JSON.parse(row)
    rescue
      nil
    end
  end
end
