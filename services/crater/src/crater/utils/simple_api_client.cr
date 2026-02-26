require "http/client"
require "json"
require "../config"
require "../forgefed/types"

module Crater
  module SimpleApiClient
    def self.fetch_tickets : Array(ForgeFed::Ticket)
      begin
        response = HTTP::Client.get("#{Config::API_URL}/tickets")
        return [] of ForgeFed::Ticket unless response.success?

        data = JSON.parse(response.body)
        items = data["data"]?.try(&.as_a) || [] of JSON::Any

        items.compact_map do |item|
          map_api_ticket(item)
        end
      rescue ex
        STDERR.puts "SimpleApiClient#fetch_tickets error: #{ex.message}"
        [] of ForgeFed::Ticket
      end
    end

    def self.fetch_ticket(id : String) : ForgeFed::Ticket?
      begin
        response = HTTP::Client.get("#{Config::API_URL}/tickets/#{id}")
        return nil unless response.success?

        data = JSON.parse(response.body)
        item = data["data"]?
        return nil unless item

        map_api_ticket(item)
      rescue ex
        STDERR.puts "SimpleApiClient#fetch_ticket error: #{ex.message}"
        nil
      end
    end

    def self.create_ticket(ticket : ForgeFed::Ticket) : ForgeFed::Ticket?
      begin
        payload = {
          "kind"       => ticket.kind,
          "title"      => ticket.title,
          "content"    => ticket.content,
          "priority"   => ticket.priority,
          "labels"     => ticket.labels,
          "milestone"  => ticket.milestone,
          "dueDate"    => ticket.due_date
        }.to_json

        headers = HTTP::Headers{"Content-Type" => "application/json"}
        response = HTTP::Client.post("#{Config::API_URL}/tickets", headers: headers, body: payload)
        return nil unless response.success?

        data = JSON.parse(response.body)
        item = data["data"]?
        return nil unless item

        map_api_ticket(item)
      rescue ex
        STDERR.puts "SimpleApiClient#create_ticket error: #{ex.message}"
        nil
      end
    end

    def self.update_ticket(id : String, updates : Hash(String, String)) : Bool
      begin
        headers = HTTP::Headers{"Content-Type" => "application/json"}
        response = HTTP::Client.put(
          "#{Config::API_URL}/tickets/#{id}",
          headers: headers,
          body: updates.to_json
        )
        response.success?
      rescue ex
        STDERR.puts "SimpleApiClient#update_ticket error: #{ex.message}"
        false
      end
    end

    def self.delete_ticket(id : String) : Bool
      begin
        response = HTTP::Client.delete("#{Config::API_URL}/tickets/#{id}")
        response.success?
      rescue ex
        STDERR.puts "SimpleApiClient#delete_ticket error: #{ex.message}"
        false
      end
    end

    def self.add_comment(ticket_id : String, content : String) : Bool
      begin
        payload = {"content" => content}.to_json
        headers = HTTP::Headers{"Content-Type" => "application/json"}
        response = HTTP::Client.post(
          "#{Config::API_URL}/tickets/#{ticket_id}/comments",
          headers: headers,
          body: payload
        )
        response.success?
      rescue ex
        STDERR.puts "SimpleApiClient#add_comment error: #{ex.message}"
        false
      end
    end

    private def self.map_api_ticket(item : JSON::Any) : ForgeFed::Ticket?
      id = item["id"]?.try(&.as_s)
      title = item["title"]?.try(&.as_s)
      return nil unless id && title

      ForgeFed::Ticket.new(
        id: id,
        kind: item["kind"]?.try(&.as_s) || "task",
        title: title,
        content: item["content"]?.try(&.as_s),
        status: item["status"]?.try(&.as_s) || "open",
        priority: item["priority"]?.try(&.as_s) || "medium",
        labels: item["labels"]?.try(&.as_a.map(&.as_s)) || [] of String,
        assignee_id: item["assigneeId"]?.try(&.as_s),
        reporter_id: item["reporterId"]?.try(&.as_s),
        milestone: item["milestone"]?.try(&.as_s),
        due_date: item["dueDate"]?.try(&.as_s),
        created_at: item["createdAt"]?.try(&.as_s) || Time::Format::ISO_8601_DATE_TIME.format(Time.utc),
        updated_at: item["updatedAt"]?.try(&.as_s) || Time::Format::ISO_8601_DATE_TIME.format(Time.utc)
      )
    end
  end
end
