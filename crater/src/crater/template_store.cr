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
      image_data_url : String?,
      base_locale : String,
      prompt_template : String,
      prompt_variables_json : String,
      translations_json : String,
      prefill_title : String,
      prefill_description : String,
      prefill_estimated_cost : Float64?,
      prefill_currency : String?,
      prefill_files_json : String,
      tags_json : String,
      pricing_mode : String,
      pricing_value : Float64,
      visibility : String,
      is_published : Bool,
      bonus_enabled : Bool,
      bonus_mode : String,
      bonus_value : Float64,
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
              image_data_url TEXT,
              base_locale TEXT NOT NULL DEFAULT 'en',
              prompt_template TEXT NOT NULL DEFAULT '',
              prompt_variables_json TEXT NOT NULL DEFAULT '[]',
              translations_json TEXT NOT NULL DEFAULT '{}',
              prefill_title TEXT NOT NULL DEFAULT '',
              prefill_description TEXT NOT NULL DEFAULT '',
              prefill_estimated_cost TEXT,
              prefill_currency TEXT,
              prefill_files_json TEXT NOT NULL DEFAULT '[]',
              tags_json TEXT NOT NULL DEFAULT '[]',
              pricing_mode TEXT NOT NULL DEFAULT 'fixed',
              pricing_value TEXT NOT NULL DEFAULT '0',
              visibility TEXT NOT NULL DEFAULT 'private',
              is_published BOOLEAN NOT NULL DEFAULT FALSE,
              bonus_enabled BOOLEAN NOT NULL DEFAULT FALSE,
              bonus_mode TEXT NOT NULL DEFAULT 'fixed',
              bonus_value TEXT NOT NULL DEFAULT '0',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          SQL

          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS image_data_url TEXT"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS base_locale TEXT NOT NULL DEFAULT 'en'"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS prompt_template TEXT NOT NULL DEFAULT ''"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS prompt_variables_json TEXT NOT NULL DEFAULT '[]'"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS translations_json TEXT NOT NULL DEFAULT '{}'"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS tags_json TEXT NOT NULL DEFAULT '[]'"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS bonus_enabled BOOLEAN NOT NULL DEFAULT FALSE"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS bonus_mode TEXT NOT NULL DEFAULT 'fixed'"
          db.exec "ALTER TABLE profile_templates ADD COLUMN IF NOT EXISTS bonus_value TEXT NOT NULL DEFAULT '0'"

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
      tags_json = source["tags"]?.to_json || "[]"
      prompt_variables_json = source["promptVariables"]?.to_json || "[]"
      translations_json = source["translations"]?.to_json || "{}"
      visibility = source["visibility"]?.try(&.as_s?) || (source["isPublished"]?.try(&.as_bool?) ? "public" : "private")
      prompt_template = source["promptTemplate"]?.try(&.as_s?) || source["prefillDescription"]?.try(&.as_s?) || source["prefillTitle"]?.try(&.as_s?) || ""
      base_locale = source["baseLocale"]?.try(&.as_s?) || "en"

      database(config).exec(
        <<-SQL,
          INSERT INTO profile_templates (
            id, profile_id, author_handle, author_display_name, slug, title, description, image_data_url,
            base_locale, prompt_template, prompt_variables_json, translations_json,
            prefill_title, prefill_description, prefill_estimated_cost, prefill_currency,
            prefill_files_json, tags_json, pricing_mode, pricing_value, visibility, is_published,
            bonus_enabled, bonus_mode, bonus_value, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
          ON CONFLICT (id) DO UPDATE SET
            profile_id = EXCLUDED.profile_id,
            author_handle = EXCLUDED.author_handle,
            author_display_name = EXCLUDED.author_display_name,
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            image_data_url = EXCLUDED.image_data_url,
            base_locale = EXCLUDED.base_locale,
            prompt_template = EXCLUDED.prompt_template,
            prompt_variables_json = EXCLUDED.prompt_variables_json,
            translations_json = EXCLUDED.translations_json,
            prefill_title = EXCLUDED.prefill_title,
            prefill_description = EXCLUDED.prefill_description,
            prefill_estimated_cost = EXCLUDED.prefill_estimated_cost,
            prefill_currency = EXCLUDED.prefill_currency,
            prefill_files_json = EXCLUDED.prefill_files_json,
            tags_json = EXCLUDED.tags_json,
            pricing_mode = EXCLUDED.pricing_mode,
            pricing_value = EXCLUDED.pricing_value,
            visibility = EXCLUDED.visibility,
            is_published = EXCLUDED.is_published,
            bonus_enabled = EXCLUDED.bonus_enabled,
            bonus_mode = EXCLUDED.bonus_mode,
            bonus_value = EXCLUDED.bonus_value,
            updated_at = EXCLUDED.updated_at
        SQL
        id,
        profile_id,
        author_handle,
        source["authorDisplayName"]?.try(&.as_s?),
        slug,
        title,
        source["description"]?.try(&.as_s?) || "",
        source["imageDataUrl"]?.try(&.as_s?),
        base_locale,
        prompt_template,
        prompt_variables_json,
        translations_json,
        source["prefillTitle"]?.try(&.as_s?) || "",
        source["prefillDescription"]?.try(&.as_s?) || "",
        source["prefillEstimatedCost"]?.try(&.raw.to_s),
        source["prefillCurrency"]?.try(&.as_s?),
        prefill_files_json,
        tags_json,
        source["pricingMode"]?.try(&.as_s?) || "fixed",
        source["pricingValue"]?.try(&.raw.to_s) || "0",
        visibility,
        visibility == "public",
        source["bonusEnabled"]?.try(&.as_bool?) || false,
        source["bonusMode"]?.try(&.as_s?) || "fixed",
        source["bonusValue"]?.try(&.raw.to_s) || "0",
        created_at,
        now
      )

      find_by_id(config, id).not_nil!
    end

    def self.find_by_id(config : Utils::Config, id : String) : TemplateRecord?
      setup(config)
      database(config).query_one?(
        "SELECT id, profile_id, author_handle, author_display_name, slug, title, description, image_data_url, base_locale, prompt_template, prompt_variables_json, translations_json, prefill_title, prefill_description, prefill_estimated_cost, prefill_currency, prefill_files_json, tags_json, pricing_mode, pricing_value, visibility, is_published, bonus_enabled, bonus_mode, bonus_value, created_at, updated_at FROM profile_templates WHERE id = $1",
        id,
        as: {String, String, String, String?, String, String, String, String?, String, String, String, String, String, String, String?, String?, String, String, String, String, String, Bool, Bool, String, String, String, String}
      ).try { |row| hydrate(row) }
    end

    def self.find_by_handle_and_slug(config : Utils::Config, handle : String, slug : String) : TemplateRecord?
      setup(config)
      database(config).query_one?(
        "SELECT id, profile_id, author_handle, author_display_name, slug, title, description, image_data_url, base_locale, prompt_template, prompt_variables_json, translations_json, prefill_title, prefill_description, prefill_estimated_cost, prefill_currency, prefill_files_json, tags_json, pricing_mode, pricing_value, visibility, is_published, bonus_enabled, bonus_mode, bonus_value, created_at, updated_at FROM profile_templates WHERE author_handle = $1 AND slug = $2",
        handle,
        slug,
        as: {String, String, String, String?, String, String, String, String?, String, String, String, String, String, String, String?, String?, String, String, String, String, String, Bool, Bool, String, String, String, String}
      ).try { |row| hydrate(row) }
    end

    def self.list_by_handle(config : Utils::Config, handle : String) : Array(TemplateRecord)
      setup(config)
      items = [] of TemplateRecord
      database(config).query(
        "SELECT id, profile_id, author_handle, author_display_name, slug, title, description, image_data_url, base_locale, prompt_template, prompt_variables_json, translations_json, prefill_title, prefill_description, prefill_estimated_cost, prefill_currency, prefill_files_json, tags_json, pricing_mode, pricing_value, visibility, is_published, bonus_enabled, bonus_mode, bonus_value, created_at, updated_at FROM profile_templates WHERE author_handle = $1 ORDER BY updated_at DESC",
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
            rs.read(String?),
            rs.read(String),
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
            rs.read(String),
            rs.read(String),
            rs.read(Bool),
            rs.read(Bool),
            rs.read(String),
            rs.read(String),
            rs.read(String),
            rs.read(String),
          })
        end
      end
      items
    end

    def self.list_public(config : Utils::Config, limit : Int32 = 24) : Array(TemplateRecord)
      setup(config)
      items = [] of TemplateRecord
      database(config).query(
        "SELECT id, profile_id, author_handle, author_display_name, slug, title, description, image_data_url, base_locale, prompt_template, prompt_variables_json, translations_json, prefill_title, prefill_description, prefill_estimated_cost, prefill_currency, prefill_files_json, tags_json, pricing_mode, pricing_value, visibility, is_published, bonus_enabled, bonus_mode, bonus_value, created_at, updated_at FROM profile_templates WHERE visibility = 'public' OR is_published = TRUE ORDER BY updated_at DESC LIMIT $1",
        limit
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
            rs.read(String?),
            rs.read(String),
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
            rs.read(String),
            rs.read(String),
            rs.read(Bool),
            rs.read(Bool),
            rs.read(String),
            rs.read(String),
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
        imageDataUrl: record.image_data_url,
        baseLocale: record.base_locale,
        promptTemplate: record.prompt_template,
        promptVariables: JSON.parse(record.prompt_variables_json),
        translations: JSON.parse(record.translations_json),
        prefillTitle: record.prefill_title,
        prefillDescription: record.prefill_description,
        prefillEstimatedCost: record.prefill_estimated_cost,
        prefillCurrency: record.prefill_currency,
        prefillFiles: JSON.parse(record.prefill_files_json),
        tags: JSON.parse(record.tags_json),
        pricingMode: record.pricing_mode,
        pricingValue: record.pricing_value,
        visibility: record.visibility,
        isPublished: record.is_published,
        bonusEnabled: record.bonus_enabled,
        bonusMode: record.bonus_mode,
        bonusValue: record.bonus_value,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }.to_json
    end

    private def self.hydrate(row : {String, String, String, String?, String, String, String, String?, String, String, String, String, String, String, String?, String?, String, String, String, String, String, Bool, Bool, String, String, String, String}) : TemplateRecord
      TemplateRecord.new(
        id: row[0],
        profile_id: row[1],
        author_handle: row[2],
        author_display_name: row[3],
        slug: row[4],
        title: row[5],
        description: row[6],
        image_data_url: row[7],
        base_locale: row[8],
        prompt_template: row[9],
        prompt_variables_json: row[10],
        translations_json: row[11],
        prefill_title: row[12],
        prefill_description: row[13],
        prefill_estimated_cost: to_f64(row[14]),
        prefill_currency: row[15],
        prefill_files_json: row[16],
        tags_json: row[17],
        pricing_mode: row[18],
        pricing_value: row[19].to_f,
        visibility: row[20],
        is_published: row[21],
        bonus_enabled: row[22],
        bonus_mode: row[23],
        bonus_value: row[24].to_f,
        created_at: row[25],
        updated_at: row[26]
      )
    end
  end
end
