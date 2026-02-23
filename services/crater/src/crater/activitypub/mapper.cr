require "json"
require "uuid"
require "./types"
require "../forgefed/types"
require "../config"

module Crater
  module ActivityPub
    module Mapper
      def self.task_to_create_activity(task : ForgeFed::Ticket) : String
        activity_id = "#{Config::BASE_URL}/activities/#{UUID.random}"
        actor = Config.actor_url

        activity = {
          "@context" => FULL_CONTEXT,
          "type"     => "Create",
          "id"       => activity_id,
          "actor"    => actor,
          "object"   => task_to_ticket_json(task),
          "published" => task.created_at
        }

        activity.to_json
      end

      def self.task_to_update_activity(task : ForgeFed::Ticket) : String
        activity_id = "#{Config::BASE_URL}/activities/#{UUID.random}"
        actor = Config.actor_url

        activity = {
          "@context" => FULL_CONTEXT,
          "type"     => "Update",
          "id"       => activity_id,
          "actor"    => actor,
          "object"   => task_to_ticket_json(task),
          "published" => task.updated_at
        }

        activity.to_json
      end

      def self.task_to_delete_activity(task_id : String) : String
        activity_id = "#{Config::BASE_URL}/activities/#{UUID.random}"
        actor = Config.actor_url
        object_id = "#{Config::BASE_URL}/tickets/#{task_id}"

        activity = {
          "@context" => FULL_CONTEXT,
          "type"     => "Delete",
          "id"       => activity_id,
          "actor"    => actor,
          "object"   => object_id,
          "published" => Time::Format::ISO_8601_DATE_TIME.format(Time.utc)
        }

        activity.to_json
      end

      def self.comment_to_create_activity(comment : ForgeFed::TicketComment) : String
        activity_id = "#{Config::BASE_URL}/activities/#{UUID.random}"
        actor = Config.actor_url

        note = {
          "type"       => "Note",
          "id"         => "#{Config::BASE_URL}/comments/#{comment.id}",
          "content"    => comment.content,
          "inReplyTo"  => "#{Config::BASE_URL}/tickets/#{comment.ticket_id}",
          "published"  => comment.created_at
        }

        activity = {
          "@context" => FULL_CONTEXT,
          "type"     => "Create",
          "id"       => activity_id,
          "actor"    => actor,
          "object"   => note,
          "published" => comment.created_at
        }

        activity.to_json
      end

      private def self.task_to_ticket_json(task : ForgeFed::Ticket)
        {
          "@context"  => FULL_CONTEXT,
          "type"      => "Ticket",
          "id"        => "#{Config::BASE_URL}/tickets/#{task.id}",
          "name"      => task.title,
          "content"   => task.content,
          "kind"      => task.kind,
          "status"    => task.status,
          "priority"  => task.priority,
          "labels"    => task.labels,
          "milestone" => task.milestone,
          "dueDate"   => task.due_date,
          "published" => task.created_at,
          "updated"   => task.updated_at
        }
      end
    end
  end
end
