require "db"
require "pg"

require "./order_queue"
require "./utils/config"

module Crater
  module PaymentStore
    record PromoQuote,
      order_id : String,
      original_amount : Float64,
      effective_amount : Float64,
      currency : String,
      promo_code : String?,
      promo_applied : Bool,
      promo_message : String?,
      strike_original_price : Bool,
      free_unlock : Bool,
      payment_address : String,
      payment_request : String?,
      payment_token_address : String,
      payment_token_symbol : String,
      payment_token_decimals : Int32,
      payment_chain_id : Int64,
      labels : Array(String),
      template_fee_amount : Float64?,
      template_author_profile_id : String?,
      template_author_username : String?

    @@db : DB::Database? = nil
    @@db_lock = Mutex.new
    @@ready = false

    def self.setup(config : Utils::Config) : Nil
      db = database(config)
      return if @@ready

      @@db_lock.synchronize do
        unless @@ready
          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS promo_codes (
              code TEXT PRIMARY KEY,
              kind TEXT NOT NULL,
              active BOOLEAN NOT NULL DEFAULT TRUE,
              metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
          SQL

          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS promo_redemptions (
              id BIGSERIAL PRIMARY KEY,
              code TEXT NOT NULL,
              order_id TEXT NOT NULL,
              subject TEXT,
              outcome TEXT NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
          SQL

          db.exec <<-SQL
            INSERT INTO promo_codes (code, kind, active, metadata)
            VALUES ('SHARDSTATEVPN', 'vpn_free', TRUE, '{"scope":"vpn"}'::jsonb)
            ON CONFLICT (code)
            DO UPDATE SET
              kind = EXCLUDED.kind,
              active = EXCLUDED.active,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
          SQL

          @@ready = true
        end
      end
    end

    def self.quote_for(order : OrderQueue::OrderRecord, config : Utils::Config, promo_code : String? = nil, subject : String? = nil) : PromoQuote
      setup(config)

      original_amount = order.estimated_cost || 0.0
      effective_amount = original_amount
      normalized_code = promo_code.try(&.strip.upcase)
      promo_applied = false
      strike_original_price = false
      free_unlock = false
      promo_message = nil
      labels = order.labels
      template_fee_amount = nil

      if order.template_pricing_mode && order.template_pricing_value && original_amount > 0
        if order.template_pricing_mode == "percent"
          template_fee_amount = (original_amount * order.template_pricing_value.not_nil!) / 100.0
        elsif order.template_pricing_mode == "fixed"
          template_fee_amount = order.template_pricing_value
        end

        if template_fee_amount
          template_fee_amount = {template_fee_amount.not_nil!, original_amount}.min
        end
      end

      if normalized_code && !normalized_code.empty?
        outcome = "invalid"
        if promo = promo_row(normalized_code, config)
          active = promo[2]
          kind = promo[1]

          if !active
            promo_message = "Promo code is disabled."
          elsif kind == "vpn_free"
            if vpn_labels?(labels)
              effective_amount = 0.0
              promo_applied = true
              strike_original_price = original_amount > 0
              free_unlock = true
              promo_message = "Promo applied. VPN delivery is now unlocked."
              outcome = "applied"
            else
              promo_message = "Promo code is only available for VPN delivery tasks."
              outcome = "rejected"
            end
          else
            promo_message = "Promo code is not supported."
          end
        else
          promo_message = "Promo code not recognized."
        end

        database(config).exec(
          "INSERT INTO promo_redemptions (code, order_id, subject, outcome) VALUES ($1, $2, $3, $4)",
          normalized_code,
          order.id,
          subject,
          outcome
        )
      end

      PromoQuote.new(
        order_id: order.id,
        original_amount: original_amount,
        effective_amount: effective_amount,
        currency: order.currency,
        promo_code: normalized_code,
        promo_applied: promo_applied,
        promo_message: promo_message,
        strike_original_price: strike_original_price,
        free_unlock: free_unlock,
        payment_address: config.payment_evm_address,
        payment_request: build_payment_request(config, effective_amount),
        payment_token_address: config.payment_token_address,
        payment_token_symbol: config.payment_token_symbol,
        payment_token_decimals: config.payment_token_decimals,
        payment_chain_id: config.payment_chain_id,
        labels: labels,
        template_fee_amount: template_fee_amount,
        template_author_profile_id: order.template_author_profile_id,
        template_author_username: order.template_author_username
      )
    end

    def self.to_json_payload(order : OrderQueue::OrderRecord, quote : PromoQuote) : String
      {
        orderId: order.id,
        title: order.title,
        status: order.status,
        currency: quote.currency,
        originalAmount: quote.original_amount,
        effectiveAmount: quote.effective_amount,
        promoCode: quote.promo_code,
        promoApplied: quote.promo_applied,
        promoMessage: quote.promo_message,
        strikeOriginalPrice: quote.strike_original_price,
        freeUnlock: quote.free_unlock,
        paymentAddress: quote.payment_address,
        paymentRequest: quote.payment_request,
        paymentChainId: quote.payment_chain_id,
        paymentTokenAddress: quote.payment_token_address,
        paymentTokenSymbol: quote.payment_token_symbol,
        paymentTokenDecimals: quote.payment_token_decimals,
        paymentUrl: order.payment_url,
        labels: quote.labels,
        templateFeeAmount: quote.template_fee_amount,
        templateAuthorProfileId: quote.template_author_profile_id,
        templateAuthorUsername: quote.template_author_username,
        templatePricingMode: order.template_pricing_mode,
        templatePricingValue: order.template_pricing_value,
        templateSlug: order.template_slug
      }.to_json
    end

    def self.to_config_payload(config : Utils::Config) : String
      {
        paymentAddress: config.payment_evm_address,
        paymentChainId: config.payment_chain_id,
        paymentTokenAddress: config.payment_token_address,
        paymentTokenSymbol: config.payment_token_symbol,
        paymentTokenDecimals: config.payment_token_decimals
      }.to_json
    end

    private def self.database(config : Utils::Config) : DB::Database
      @@db_lock.synchronize do
        @@db ||= DB.open(config.database_url)
      end
    end

    private def self.promo_row(code : String, config : Utils::Config)
      database(config).query_one?(
        "SELECT code, kind, active FROM promo_codes WHERE code = $1",
        code,
        as: {String, String, Bool}
      )
    end

    private def self.vpn_labels?(labels : Array(String)) : Bool
      labels.any? { |label| label.downcase.includes?("vpn") }
    end

    private def self.build_payment_request(config : Utils::Config, amount : Float64) : String?
      address = config.payment_evm_address.strip
      return nil if address.empty? || address.downcase == "0x0000000000000000000000000000000000000000" || amount <= 0

      scale = 10_i64 ** config.payment_token_decimals
      atomic_amount = (amount * scale).round.to_i64
      "ethereum:#{config.payment_token_address}@#{config.payment_chain_id}/transfer?address=#{address}&uint256=#{atomic_amount}"
    end
  end
end
