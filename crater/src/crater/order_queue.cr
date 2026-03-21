require "json"
require "mutex"
require "time"
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
        @payment_url : String? = nil
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

    @@lock = Mutex.new
    @@orders = [] of OrderRecord
    @@activities = [] of JSON::Any

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

      raw_status = to_string(payload["status"]?) || to_string(source["status"]?)
      status = raw_status && !raw_status.empty? ? raw_status : "queued"

      id = to_string(payload["id"]?) || to_string(source["id"]?) || "#{config.actor_id}/orders/#{UUID.random.to_s}"
      title = to_string(payload["name"]?) || to_string(payload["title"]?) || to_string(source["name"]?) || to_string(source["title"]?) || "Untitled order"
      description = to_string(payload["content"]?) || to_string(payload["description"]?) || to_string(source["content"]?) || to_string(source["description"]?) || ""
      estimated_cost = to_float(payload["estimatedCost"]?) || to_float(payload["price"]?) || to_float(source["estimatedCost"]?) || to_float(source["price"]?) || 0.0
      execution_estimate = to_string(payload["executionEstimate"]?) || to_string(payload["dueDate"]?) || to_string(source["executionEstimate"]?) || to_string(source["dueDate"]?)
      currency = to_string(payload["currency"]?) || to_string(source["currency"]?) || "USDC"

      OrderRecord.new(
        id: id,
        status: status,
        solver: next_solver,
        title: title,
        description: description,
        estimated_cost: estimated_cost,
        currency: currency,
        execution_estimate: execution_estimate
      )
    end

    def self.activity_object(
      order : OrderRecord,
      status : String,
      config : Utils::Config
    ) : JSON::Any
      ticket_payload = {
        "@context" => [ActivityPub::CONTEXT, ForgeFed::CONTEXT],
        "id" => "#{order.id}/ticket",
        "type" => "Ticket",
        "name" => order.title,
        "content" => order.description,
        "status" => status,
        "reporter" => config.actor_id,
        "labels" => [] of String,
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
        "published" => order.updated_at,
        "attachment" => payment_links(order, status, config)
      }

      JSON.parse(object_payload.to_json)
    end

    private def self.payment_links(order : OrderRecord, status : String, config : Utils::Config)
      return [] of JSON::Any if status != "completed"

      payment = order.payment_url || "#{config.actor_outbox}/pay/#{order.id}"
      payment_record = {
        "type" => "Link",
        "name" => "Pay invoice",
        "rel" => "https://w3id.org/fep/0ea0#payment",
        "href" => payment,
        "mediaType" => "application/json",
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
        "id" => "#{config.actor_outbox}/activities/#{UUID.random.to_s}",
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
        @@orders << record
        @@activities.unshift(activity_for(record, record.status, config))
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
        @@orders << record
        @@activities.unshift(activity_for(record, record.status, config))
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
        record = @@orders.find { |item| item.id == order_id }
        next unless record

        record.status = status
        record.updated_at = current_time
        record.payment_url = "#{config.actor_outbox}/pay/#{record.id}" if status == "completed"

        @@activities.unshift(activity_for(record, record.status, config))
      end
    end

    def self.find_order(order_id : String) : OrderRecord?
      @@lock.synchronize do
        @@orders.find { |record| record.id == order_id }
      end
    end

    def self.total_items
      @@lock.synchronize do
        @@activities.size
      end
    end

    def self.activity_page(page : Int32) : Array(JSON::Any)
      @@lock.synchronize do
        return [] of JSON::Any if page < 1

        start = (page - 1) * EVENT_PAGE_SIZE
        return [] of JSON::Any if start >= @@activities.size

        @@activities[start, EVENT_PAGE_SIZE] || [] of JSON::Any
      end
    end

    def self.latest_by_order(order_id : String) : JSON::Any?
      @@lock.synchronize do
        @@activities.each do |item|
          object = item["object"]?
          next unless object

          hash = object.as_h?
          next unless hash

          next if to_string(hash["id"]) != order_id
          return item
        end
        nil
      end
    end
  end
end
