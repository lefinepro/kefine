require "base64"
require "digest/sha256"
require "uuid"

module Lepos
  module Utils
    module ActorKeys
      extend self

      PRIVATE_KEY_PREFIX        = "pqsk_"
      PUBLIC_KEY_PREFIX         = "pqpk_"
      ADDRESS_PREFIX            = "pq1_"
      COMPACT_PUBLIC_KEY_LENGTH = 30
      COMPACT_ADDRESS_LENGTH    = 30

      def normalize_private_key(value : String) : String
        stripped_value = value.strip
        return decode_key_string(stripped_value, PRIVATE_KEY_PREFIX) if stripped_value.starts_with?(PRIVATE_KEY_PREFIX)

        expanded =
          stripped_value
            .gsub("\\r\\n", "\n")
            .gsub("\\n", "\n")
            .gsub("\r\n", "\n")
            .gsub('\r', '\n')

        expanded
          .lines
          .map(&.strip)
          .reject(&.empty?)
          .join("\n")
      end

      def encode_private_key_string(private_key_pem : String) : String
        normalized_private_key = normalize_private_key(private_key_pem)
        return "" if normalized_private_key.empty?

        encode_key_string(normalized_private_key, PRIVATE_KEY_PREFIX)
      end

      def encode_public_key_string(public_key_pem : String) : String
        normalized_public_key = normalize_public_key(public_key_pem)
        return "" if normalized_public_key.empty?

        encode_key_string(normalized_public_key, PUBLIC_KEY_PREFIX)
      end

      def derive_public_key_string(private_key_pem : String) : String
        public_key_pem = derive_public_key_pem(private_key_pem)
        return "" unless public_key_pem

        encode_public_key_string(public_key_pem)
      end

      def public_key_string_to_compact(value : String) : String
        stripped_value = value.strip
        return "" if stripped_value.empty?

        if compact_public_key_string?(stripped_value)
          return Base64.urlsafe_encode(decode_compact_public_key_string(stripped_value).to_slice, padding: false)
        end

        normalized_public_key = normalize_public_key(stripped_value)
        return "" if normalized_public_key.empty?

        with_temp_public_key(normalized_public_key) do |path|
          public_der = run_openssl(["pkey", "-pubin", "-in", path, "-outform", "DER"])
          public_der ? Base64.urlsafe_encode(public_der.to_slice, padding: false) : ""
        end
      end

      def public_key_pem_from_string(value : String) : String?
        stripped_value = value.strip
        return nil if stripped_value.empty?

        if compact_public_key_string?(stripped_value)
          public_der = decode_compact_public_key_string(stripped_value)
          return nil if public_der.empty?

          with_temp_public_key(public_der) do |path|
            run_openssl(["pkey", "-pubin", "-inform", "DER", "-in", path, "-pubout"])
          end
        else
          normalized_public_key = normalize_public_key(stripped_value)
          return nil if normalized_public_key.empty?

          with_temp_public_key(normalized_public_key) do |path|
            run_openssl(["pkey", "-pubin", "-in", path, "-pubout"])
          end
        end
      end

      def normalize_public_key(value : String) : String
        stripped_value = value.strip
        return decode_key_string(stripped_value, PUBLIC_KEY_PREFIX) if stripped_value.starts_with?(PUBLIC_KEY_PREFIX)

        stripped_value
          .gsub("\\r\\n", "\n")
          .gsub("\\n", "\n")
          .gsub("\r\n", "\n")
          .gsub('\r', '\n')
          .lines
          .map(&.strip)
          .reject(&.empty?)
          .join("\n")
      end

      def derive_public_key_pem(private_key_pem : String) : String?
        normalized_private_key = normalize_private_key(private_key_pem)
        return nil if normalized_private_key.empty?

        with_temp_private_key(normalized_private_key) do |path|
          run_openssl(["pkey", "-in", path, "-pubout"])
        end
      end

      def derive_actor_address(private_key_pem : String) : String?
        normalized_private_key = normalize_private_key(private_key_pem)
        return nil if normalized_private_key.empty?

        with_temp_private_key(normalized_private_key) do |path|
          public_der = run_openssl(["pkey", "-in", path, "-pubout", "-outform", "DER"])
          digest_source = public_der || normalized_private_key
          digest = Digest::SHA256.hexdigest(digest_source)
          "#{ADDRESS_PREFIX}#{digest[0, COMPACT_ADDRESS_LENGTH - ADDRESS_PREFIX.bytesize]}"
        end
      end

      def private_key_matches?(submitted_value : String, configured_private_key_pem : String) : Bool
        submitted = submitted_value.strip
        return false if submitted.empty?

        normalized_configured_key = normalize_private_key(configured_private_key_pem)
        return false if normalized_configured_key.empty?

        if compact_private_key_string?(submitted)
          return submitted == encode_private_key_string(normalized_configured_key)
        end

        normalized_submitted_key = normalize_private_key(submitted)
        return false if normalized_submitted_key.empty?

        normalized_submitted_key == normalized_configured_key
      end

      def public_key_matches?(submitted_value : String, configured_private_key_pem : String) : Bool
        submitted = submitted_value.strip
        return false if submitted.empty?

        submitted_compact_key = public_key_string_to_compact(submitted)
        return false if submitted_compact_key.empty?

        configured_public_key = derive_public_key_string(configured_private_key_pem)
        configured_compact_key = public_key_string_to_compact(configured_public_key)
        return false if configured_compact_key.empty?

        submitted_compact_key == configured_compact_key
      end

      def compact_private_key_string?(value : String) : Bool
        return false unless value.starts_with?(PRIVATE_KEY_PREFIX)

        !decode_key_string(value, PRIVATE_KEY_PREFIX).empty?
      end

      def compact_public_key_string?(value : String) : Bool
        return false if value.starts_with?(PUBLIC_KEY_PREFIX)
        return false if value.includes?("BEGIN")

        !decode_compact_public_key_string(value).empty?
      end

      private def encode_key_string(value : String, prefix : String) : String
        encoded = Base64.urlsafe_encode(value.to_slice, padding: false)
        "#{prefix}#{encoded}"
      end

      private def decode_key_string(value : String, prefix : String) : String
        encoded = value.lchop(prefix)
        return "" if encoded.empty?

        padded = encoded + ("=" * ((4 - (encoded.bytesize % 4)) % 4))
        standard_base64 = padded.tr("-_", "+/")
        Base64.decode_string(standard_base64)
      rescue
        ""
      end

      private def with_temp_private_key(private_key_pem : String, &)
        path = File.join(Dir.tempdir, "kefine-actor-key-#{UUID.random}.pem")
        begin
          File.write(path, private_key_pem)
          yield path
        ensure
          File.delete(path) if File.exists?(path)
        end
      end

      private def with_temp_public_key(public_key : String, &)
        path = File.join(Dir.tempdir, "kefine-public-key-#{UUID.random}.key")
        begin
          File.write(path, public_key)
          yield path
        ensure
          File.delete(path) if File.exists?(path)
        end
      end

      private def decode_compact_public_key_string(value : String) : String
        stripped = value.strip
        return "" if stripped.empty?

        padded = stripped + ("=" * ((4 - (stripped.bytesize % 4)) % 4))
        standard_base64 = padded.tr("-_", "+/")
        Base64.decode_string(standard_base64)
      rescue
        ""
      end

      private def run_openssl(args : Array(String)) : String?
        output = IO::Memory.new
        error = IO::Memory.new
        status = Process.run("openssl", args, output: output, error: error)
        return nil unless status.success?

        value = output.to_s.strip
        value.empty? ? nil : value
      end
    end
  end
end
