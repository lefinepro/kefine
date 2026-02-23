require "kemal"
require "json"
require "../config"
require "../activitypub/types"
require "../forgefed/types"
require "../utils/simple_api_client"

module Crater
  module Handlers
    module Inbox
      def self.register
        # Main actor inbox
        post "/inbox" do |env|
          process_inbox(env)
        end

        # Project-specific inbox (ForgeFed)
        post "/projects/:id/inbox" do |env|
          process_inbox(env)
        end

        # Shared inbox for batch delivery
        post "/shared-inbox" do |env|
          process_inbox(env)
        end
      end

      private def self.process_inbox(env : HTTP::Server::Context) : String
        env.response.content_type = "application/activity+json"

        body = env.request.body.try(&.gets_to_end) || ""

        begin
          activity = JSON.parse(body)
          activity_type = activity["type"]?.try(&.as_s) || ""

          case activity_type
          when "Create"
            handle_create(activity)
          when "Update"
            handle_update(activity)
          when "Delete"
            handle_delete(activity)
          when "Follow"
            handle_follow(activity)
          when "Accept"
            # Accept follow — acknowledge
          when "Add"
            handle_add(activity)
          when "Remove"
            handle_remove(activity)
          else
            # Unknown activity type — log and accept
            STDERR.puts "Unknown activity type: #{activity_type}" if Config.development?
          end

          env.response.status_code = 202
          %({"status": "accepted"})
        rescue ex : JSON::ParseException
          env.response.status_code = 400
          %({"error": "invalid_json", "message": "#{ex.message}"})
        rescue ex
          STDERR.puts "Inbox error: #{ex.message}"
          env.response.status_code = 500
          %({"error": "internal_error", "message": "Failed to process activity"})
        end
      end

      private def self.handle_create(activity : JSON::Any)
        obj = activity["object"]?
        return unless obj

        obj_type = obj["type"]?.try(&.as_s) || ""

        case obj_type
        when "Ticket"
          ticket = parse_ticket(obj)
          if ticket
            SimpleApiClient.create_ticket(ticket)
          end
        when "Note"
          # Comment on a ticket
          ticket_id = extract_ticket_id(obj["inReplyTo"]?.try(&.as_s))
          if ticket_id
            content = obj["content"]?.try(&.as_s) || ""
            SimpleApiClient.add_comment(ticket_id, content)
          end
        end
      end

      private def self.handle_update(activity : JSON::Any)
        obj = activity["object"]?
        return unless obj

        obj_type = obj["type"]?.try(&.as_s) || ""
        return unless obj_type == "Ticket"

        ticket_id = extract_ticket_id(obj["id"]?.try(&.as_s))
        return unless ticket_id

        updates = {} of String => String
        obj["status"]?.try { |s| updates["status"] = s.as_s }
        obj["priority"]?.try { |p| updates["priority"] = p.as_s }

        SimpleApiClient.update_ticket(ticket_id, updates) unless updates.empty?
      end

      private def self.handle_delete(activity : JSON::Any)
        obj = activity["object"]?
        return unless obj

        obj_id = obj.as_s? || obj["id"]?.try(&.as_s)
        return unless obj_id

        ticket_id = extract_ticket_id(obj_id)
        SimpleApiClient.delete_ticket(ticket_id) if ticket_id
      end

      private def self.handle_follow(activity : JSON::Any)
        # ForgeFed project follow — could send Accept back
        STDERR.puts "Follow activity received" if Config.development?
      end

      private def self.handle_add(activity : JSON::Any)
        # Membership Add activity
        STDERR.puts "Add activity received" if Config.development?
      end

      private def self.handle_remove(activity : JSON::Any)
        # Membership Remove activity
        STDERR.puts "Remove activity received" if Config.development?
      end

      private def self.parse_ticket(obj : JSON::Any) : ForgeFed::Ticket?
        id = obj["id"]?.try(&.as_s) || UUID.random.to_s
        kind = obj["kind"]?.try(&.as_s) || "task"
        title = obj["name"]?.try(&.as_s)
        return nil unless title

        ForgeFed::Ticket.new(
          id: extract_ticket_id(id) || UUID.random.to_s,
          kind: kind,
          title: title,
          content: obj["content"]?.try(&.as_s),
          status: obj["status"]?.try(&.as_s) || "open",
          priority: obj["priority"]?.try(&.as_s) || "medium",
          labels: obj["labels"]?.try(&.as_a.map(&.as_s)) || [] of String,
          milestone: obj["milestone"]?.try(&.as_s),
          due_date: obj["dueDate"]?.try(&.as_s)
        )
      end

      private def self.extract_ticket_id(url : String?) : String?
        return nil unless url
        # Extract ID from URL like https://crater.example.com/tickets/123
        parts = url.split("/")
        parts.last?
      end
    end
  end
end
