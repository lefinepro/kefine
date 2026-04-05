require "db"
require "json"
require "pg"
require "uuid"

require "./utils/config"

module Crater
  module TemplateStore
    record TemplateRecord,
      id : String,
      profile_id : String,
      author_handle : String,
      author_display_name : String?,
      slug : String,
      title : String,
      description : String,
      prefill_title : String,
      prefill_description : String,
      prefill_estimated_cost : Float64?,
      prefill_currency : String?,
      prefill_files_json : String,
      pricing_mode : String,
      pricing_value : Float64,
      is_published : Bool,
      created_at : String,
      updated_at : String

    @@db : DB::Database? = nil
    @@db_lock = Mutex.new
    @@ready = false

    private def self.database(config : Utils::Config) : DB::Database
      @@db_lock.synchronize do
        @@db ||= DB.open(config.database_url)
      end
    end

    def self.setup(config : Utils::Config) : Nil
      db = database(config)
      return if @@ready

      @@db_lock.synchronize do
        unless @@ready
          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS profile_templates (
              id TEXT PRIMARY KEY,
              profile_id TEXT NOT NULL,
              author_handle TEXT NOT NULL,
              author_display_name TEXT,
              slug TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT NOT NULL DEFAULT '',
              prefill_title TEXT NOT NULL DEFAULT '',
              prefill_description TEXT NOT NULL DEFAULT '',
              prefill_estimated_cost TEXT,
              prefill_currency TEXT,
              prefill_files_json TEXT NOT NULL DEFAULT '[]',
              pricing_mode TEXT NOT NULL DEFAULT 'fixed',
              pricing_value TEXT NOT NULL DEFAULT '0',
              is_published BOOLEAN NOT NULL DEFAULT FALSE,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          SQL

          db.exec "CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_templates_handle_slug ON profile_templates(author_handle, slug)"
          @@ready = true
        end
      end
    end

    private def self.current_time : String
      Time.utc.to_rfc3339
    end

    private def self.to_f64(value : String?) : Float64?
      value.try(&.to_f?)
    end

    def self.upsert(config : Utils::Config, payload : JSON::Any) : TemplateRecord
      setup(config)
      source = payload.as_h
      now = current_time
      id = source["id"]?.try(&.as_s?) || UUID.random.to_s
      profile_id = source["authorProfileId"]?.try(&.as_s?) || source["profileId"]?.try(&.as_s?) || ""
      author_handle = source["authorHandle"]?.try(&.as_s?) || ""
      raise ArgumentError.new("Missing author handle") if author_handle.empty?

      title = source["title"]?.try(&.as_s?) || "Untitled template"
      slug = source["slug"]?.try(&.as_s?) || UUID.random.to_s
      created_at = source["createdAt"]?.try(&.as_s?) || now
      prefill_files_json = source["prefillFiles"]?.to_json || "[]"

      database(config).exec(
        <<-SQL,
          INSERT INTO profile_templates (
            id, profile_id, author_handle, author_display_name, slug, title, description,
            prefill_title, prefill_description, prefill_estimated_cost, prefill_currency,
            prefill_files_json, pricing_mode, pricing_value, is_published, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            profile_id = EXCLUDED.profile_id,
            author_handle = EXCLUDED.author_handle,
            author_display_name = EXCLUDED.author_display_name,
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            prefill_title = EXCLUDED.prefill_title,
            prefill_description = EXCLUDED.prefill_description,
            prefill_estimated_cost = EXCLUDED.prefill_estimated_cost,
            prefill_currency = EXCLUDED.prefill_currency,
            prefill_files_json = EXCLUDED.prefill_files_json,
            pricing_mode = EXCLUDED.pricing_mode,
            pricing_value = EXCLUDED.pricing_value,
            is_published = EXCLUDED.is_published,
            updated_at = EXCLUDED.updated_at
        SQL
        id,
        profile_id,
        author_handle,
        source["authorDisplayName"]?.try(&.as_s?),
        slug,
        title,
        source["description"]?.try(&.as_s?) || "",
        source["prefillTitle"]?.try(&.as_s?) || "",
        source["prefillDescription"]?.try(&.as_s?) || "",
        source["prefillEstimatedCost"]?.try(&.raw.to_s),
        source["prefillCurrency"]?.try(&.as_s?),
        prefill_files_json,
        source["pricingMode"]?.try(&.as_s?) || "fixed",
        source["pricingValue"]?.try(&.raw.to_s) || "0",
        source["isPublished"]?.try(&.as_bool?) || false,
        created_at,
        now
      )

      find_by_id(config, id).not_nil!
    end

    def self.find_by_id(config : Utils::Config, id : String) : TemplateRecord?
      setup(config)
      database(config).query_one?(
        "SELECT id, profile_id, author_handle, author_display_name, slug, title, description, prefill_title, prefill_description, prefill_estimated_cost, prefill_currency, prefill_files_json, pricing_mode, pricing_value, is_published, created_at, updated_at FROM profile_templates WHERE id = $1",
        id,
        as: {String, String, String, String?, String, String, String, String, String, String?, String?, String, String, String, Bool, String, String}
      ).try { |row| hydrate(row) }
    end

    def self.find_by_handle_and_slug(config : Utils::Config, handle : String, slug : String) : TemplateRecord?
      setup(config)
      database(config).query_one?(
        "SELECT id, profile_id, author_handle, author_display_name, slug, title, description, prefill_title, prefill_description, prefill_estimated_cost, prefill_currency, prefill_files_json, pricing_mode, pricing_value, is_published, created_at, updated_at FROM profile_templates WHERE author_handle = $1 AND slug = $2",
        handle,
        slug,
        as: {String, String, String, String?, String, String, String, String, String, String?, String?, String, String, String, Bool, String, String}
      ).try { |row| hydrate(row) }
    end

    def self.list_by_handle(config : Utils::Config, handle : String) : Array(TemplateRecord)
      setup(config)
      items = [] of TemplateRecord
      database(config).query(
        "SELECT id, profile_id, author_handle, author_display_name, slug, title, description, prefill_title, prefill_description, prefill_estimated_cost, prefill_currency, prefill_files_json, pricing_mode, pricing_value, is_published, created_at, updated_at FROM profile_templates WHERE author_handle = $1 ORDER BY updated_at DESC",
        handle
      ) do |rs|
        rs.each do
          items << hydrate({
            rs.read(String),
            rs.read(String),
            rs.read(String),
            rs.read(String?),
            rs.read(String),
            rs.read(String),
            rs.read(String),
            rs.read(String),
            rs.read(String),
            rs.read(String?),
            rs.read(String?),
            rs.read(String),
            rs.read(String),
            rs.read(String),
            rs.read(Bool),
            rs.read(String),
            rs.read(String),
          })
        end
      end
      items
    end

    def self.delete(config : Utils::Config, id : String) : Bool
      setup(config)
      database(config).exec("DELETE FROM profile_templates WHERE id = $1", id)
      true
    end

    def self.to_json(record : TemplateRecord) : String
      {
        id: record.id,
        profileId: record.profile_id,
        authorHandle: record.author_handle,
        authorDisplayName: record.author_display_name,
        slug: record.slug,
        title: record.title,
        description: record.description,
        prefillTitle: record.prefill_title,
        prefillDescription: record.prefill_description,
        prefillEstimatedCost: record.prefill_estimated_cost,
        prefillCurrency: record.prefill_currency,
        prefillFiles: JSON.parse(record.prefill_files_json),
        pricingMode: record.pricing_mode,
        pricingValue: record.pricing_value,
        isPublished: record.is_published,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }.to_json
    end

    private def self.hydrate(row : {String, String, String, String?, String, String, String, String, String, String?, String?, String, String, String, Bool, String, String}) : TemplateRecord
      TemplateRecord.new(
        id: row[0],
        profile_id: row[1],
        author_handle: row[2],
        author_display_name: row[3],
        slug: row[4],
        title: row[5],
        description: row[6],
        prefill_title: row[7],
        prefill_description: row[8],
        prefill_estimated_cost: to_f64(row[9]),
        prefill_currency: row[10],
        prefill_files_json: row[11],
        pricing_mode: row[12],
        pricing_value: row[13].to_f,
        is_published: row[14],
        created_at: row[15],
        updated_at: row[16]
      )
    end
  end
end
