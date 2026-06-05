require "json"
require "random/secure"
require "aptok/federation/federation"
require "crater-openai/crater_openai"
require "./aptok"
require "./utils/config"

module Lepos
  # The solver-side return path. A configured solver service processes the
  # messages relayed to its inbox and returns the result by POSTing it back to
  # the platform's `/api/responses` endpoint, authenticated with its bearer
  # token. The initial provider we support is OpenAI, so the payload posted
  # back follows the OpenAI Responses API shape; this module is the processing
  # layer that authenticates the solver, normalizes the OpenAI response, and
  # builds a relayable result activity out of it.
  module SolverResponses
    PROVIDER = "openai"

    # Extract the bearer token from an `Authorization` header value.
    def self.bearer_token(authorization : String?) : String?
      return nil unless authorization

      match = authorization.strip.match(/\ABearer\s+(.+)\z/i)
      return nil unless match

      token = match[1].strip
      token.empty? ? nil : token
    end

    # Resolve the configured solver that owns the supplied `Authorization`
    # bearer token. Returns `nil` when the header is missing/malformed or no
    # configured solver owns the token, so callers can answer 401.
    def self.authenticate(config : Utils::Config, authorization : String?) : Utils::RelayInternalService?
      token = bearer_token(authorization)
      return nil unless token

      config.relay_internal_services.find do |service|
        service_token = service.token
        !service_token.nil? && !service_token.empty? && service_token == token
      end
    end

    def self.parse_payload(body : String) : ::Aptok::JsonMap
      parsed = JSON.parse(body)
      map = parsed.as_h? || raise JSON::ParseException.new("Response payload must be an object", 1, 1)
      map.as(::Aptok::JsonMap)
    end

    # The processing layer. Take the OpenAI Responses payload returned by the
    # solver and normalize it into a result the platform owns: the assembled
    # output text, the model/status/ids, the request it answers, and a
    # relayable `Create`/`Note` activity attributed to the solver.
    def self.build_result(
      payload : ::Aptok::JsonMap,
      solver : Utils::RelayInternalService,
      config : Utils::Config,
    ) : ::Aptok::JsonMap
      if normalized = normalize_openai_request(payload)
        return build_openai_request_result(payload, normalized, solver, config)
      end

      output_text = extract_output_text(payload)
      model = string_field(payload, "model")
      status = string_field(payload, "status") || "completed"
      response_id = string_field(payload, "id")
      request_id = extract_request_id(payload)

      activity = build_activity(solver, config, response_id, request_id, output_text)

      ::Aptok::JsonMap{
        "accepted"   => ::Aptok.json(true),
        "provider"   => ::Aptok.json(PROVIDER),
        "solver"     => ::Aptok.json(solver.id),
        "responseId" => ::Aptok.json(response_id),
        "requestId"  => ::Aptok.json(request_id),
        "model"      => ::Aptok.json(model),
        "status"     => ::Aptok.json(status),
        "outputText" => ::Aptok.json(output_text),
        "activity"   => ::Aptok.json(activity),
      }
    end

    # OpenAI Responses request payloads are normalized by the dedicated
    # crater-openai project. Lepos only accepts that OpenAI shape here.
    def self.normalize_openai_request(payload : ::Aptok::JsonMap) : ::CraterOpenAI::NormalizedOpenAIRequest?
      return nil unless payload.has_key?("input")

      ::CraterOpenAI::OpenAINormalizer.new.from_responses(payload)
    end

    # Assemble the assistant text from an OpenAI Responses payload. Prefers the
    # convenience `output_text` field, otherwise concatenates the
    # `output[].content[].text` segments of type `output_text`.
    def self.extract_output_text(payload : ::Aptok::JsonMap) : String
      if direct = string_field(payload, "output_text")
        return direct
      end

      segments = [] of String
      payload["output"]?.try(&.as_a?).try do |items|
        items.each do |item|
          map = item.as_h?
          next unless map

          map["content"]?.try(&.as_a?).try do |parts|
            parts.each do |part|
              part_map = part.as_h?
              next unless part_map
              next unless (part_map["type"]?.try(&.as_s?)) == "output_text"

              text = part_map["text"]?.try(&.as_s?)
              segments << text if text && !text.empty?
            end
          end
        end
      end

      segments.join
    end

    # The relayed activity a solver answers. The solver echoes it back through
    # a top-level `request_id`/`request` or the OpenAI `metadata.request_id`.
    def self.extract_request_id(payload : ::Aptok::JsonMap) : String?
      if direct = string_field(payload, "request_id") || string_field(payload, "request")
        return direct
      end

      payload["metadata"]?.try(&.as_h?).try do |metadata|
        return string_field(metadata, "request_id") || string_field(metadata, "requestId")
      end

      nil
    end

    private def self.string_field(map : ::Aptok::JsonMap, key : String) : String?
      value = map[key]?.try(&.as_s?)
      return nil unless value

      trimmed = value.strip
      trimmed.empty? ? nil : trimmed
    end

    private def self.build_openai_request_result(
      payload : ::Aptok::JsonMap,
      normalized : ::CraterOpenAI::NormalizedOpenAIRequest,
      solver : Utils::RelayInternalService,
      config : Utils::Config,
    ) : ::Aptok::JsonMap
      response_id = string_field(payload, "id")
      request_id = extract_request_id(payload)
      activity = build_ticket_activity(solver, config, response_id, request_id, normalized)

      ::Aptok::JsonMap{
        "accepted"   => ::Aptok.json(true),
        "provider"   => ::Aptok.json(PROVIDER),
        "solver"     => ::Aptok.json(solver.id),
        "responseId" => ::Aptok.json(response_id),
        "requestId"  => ::Aptok.json(request_id),
        "model"      => ::Aptok.json(normalized.model),
        "status"     => ::Aptok.json("accepted"),
        "title"      => ::Aptok.json(normalized.title),
        "inputText"  => ::Aptok.json(normalized.content),
        "activity"   => ::Aptok.json(activity),
      }
    end

    private def self.build_activity(
      solver : Utils::RelayInternalService,
      config : Utils::Config,
      response_id : String?,
      request_id : String?,
      output_text : String,
    ) : ::Aptok::JsonMap
      suffix = response_id || ::Aptok.now
      note_id = "#{solver.id}/responses/#{suffix}"
      note = ::Aptok.note(note_id, output_text, attributed_to: solver.id)
      note["inReplyTo"] = ::Aptok.json(request_id) if request_id

      activity_id = "#{note_id}/activity"
      activity = ::Aptok.create(activity_id, solver.id, note)
      activity["inReplyTo"] = ::Aptok.json(request_id) if request_id
      activity
    end

    private def self.build_ticket_activity(
      solver : Utils::RelayInternalService,
      config : Utils::Config,
      response_id : String?,
      request_id : String?,
      normalized : ::CraterOpenAI::NormalizedOpenAIRequest,
    ) : ::Aptok::JsonMap
      suffix = response_id || ::Random::Secure.hex(10)
      ticket_id = "#{solver.id}/responses/#{suffix}/ticket"
      ticket = ::Aptok.forgefed_ticket(
        ticket_id,
        normalized.title,
        normalized.content,
        assignee: presence(normalized.assignee),
        attributed_to: presence(normalized.attributed_to) || solver.id,
      )
      ticket["inReplyTo"] = ::Aptok.json(request_id) if request_id

      activity_id = "#{ticket_id}/activity"
      activity = ::Aptok.create(activity_id, solver.id, ticket, [::Aptok::PUBLIC_COLLECTION], config.relay_actor_id)
      activity["inReplyTo"] = ::Aptok.json(request_id) if request_id
      activity
    end

    private def self.presence(value : String?) : String?
      return nil unless value

      stripped = value.strip
      stripped.empty? ? nil : stripped
    end
  end
end
