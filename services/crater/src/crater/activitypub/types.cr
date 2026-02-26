require "json"

module Crater
  module ActivityPub
    CONTEXT        = "https://www.w3.org/ns/activitystreams"
    SECURITY_CONTEXT = "https://w3id.org/security/v1"

    struct Activity
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      getter context : JSON::Any

      getter id : String
      getter type : String
      getter actor : String
      getter object : JSON::Any
      getter published : String?
      getter to : Array(String)?
      getter cc : Array(String)?
    end

    struct PublicKey
      include JSON::Serializable

      getter id : String
      getter owner : String

      @[JSON::Field(key: "publicKeyPem")]
      getter public_key_pem : String
    end

    struct Endpoints
      include JSON::Serializable

      @[JSON::Field(key: "sharedInbox")]
      getter shared_inbox : String?
    end

    struct Actor
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      getter context : Array(String)

      getter id : String
      getter type : String
      getter name : String

      @[JSON::Field(key: "preferredUsername")]
      getter preferred_username : String

      getter inbox : String
      getter outbox : String
      getter endpoints : Endpoints?

      @[JSON::Field(key: "publicKey")]
      getter public_key : PublicKey
    end

    struct OrderedCollection
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      getter context : String

      getter id : String
      getter type : String

      @[JSON::Field(key: "totalItems")]
      getter total_items : Int32

      @[JSON::Field(key: "orderedItems")]
      getter ordered_items : Array(JSON::Any)

      getter first : String?
      getter last : String?

      def initialize(
        @id : String,
        @total_items : Int32,
        @ordered_items : Array(JSON::Any) = [] of JSON::Any,
        @first : String? = nil,
        @last : String? = nil
      )
        @context = CONTEXT
        @type = "OrderedCollection"
      end
    end
  end
end
