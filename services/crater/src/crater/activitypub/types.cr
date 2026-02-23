require "json"

module Crater
  module ActivityPub
    AP_CONTEXT  = "https://www.w3.org/ns/activitystreams"
    FF_CONTEXT  = "https://forgefed.org"
    FULL_CONTEXT = [AP_CONTEXT, FF_CONTEXT]

    # Base ActivityPub Object
    struct Object
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      property context : Array(String)?

      property type : String
      property id : String?
      property name : String?
      property summary : String?
      property content : String?
      property url : String?
      property published : String?
      property updated : String?

      def initialize(
        @type : String,
        @id : String? = nil,
        @name : String? = nil,
        @content : String? = nil,
        @context : Array(String)? = nil,
        @summary : String? = nil,
        @url : String? = nil,
        @published : String? = nil,
        @updated : String? = nil
      )
      end
    end

    # ActivityPub Actor (Person, Application, Service)
    struct Actor
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      property context : Array(String)

      property type : String
      property id : String
      property name : String?
      property summary : String?

      @[JSON::Field(key: "preferredUsername")]
      property preferred_username : String

      property inbox : String
      property outbox : String
      property followers : String?
      property following : String?
      property url : String?

      @[JSON::Field(key: "publicKey")]
      property public_key : PublicKey?

      property endpoints : Endpoints?

      def initialize(
        @type : String,
        @id : String,
        @preferred_username : String,
        @inbox : String,
        @outbox : String,
        @context : Array(String) = FULL_CONTEXT,
        @name : String? = nil,
        @summary : String? = nil,
        @followers : String? = nil,
        @following : String? = nil,
        @url : String? = nil,
        @public_key : PublicKey? = nil,
        @endpoints : Endpoints? = nil
      )
      end
    end

    struct PublicKey
      include JSON::Serializable

      property id : String
      property owner : String

      @[JSON::Field(key: "publicKeyPem")]
      property public_key_pem : String

      def initialize(@id : String, @owner : String, @public_key_pem : String)
      end
    end

    struct Endpoints
      include JSON::Serializable

      @[JSON::Field(key: "sharedInbox")]
      property shared_inbox : String?

      def initialize(@shared_inbox : String? = nil)
      end
    end

    # ActivityPub Activity (Create, Update, Delete, Follow, Accept, Add, Remove)
    struct Activity
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      property context : Array(String)?

      property type : String
      property id : String?
      property actor : String
      property to : Array(String)?
      property cc : Array(String)?
      property object : JSON::Any?
      property published : String?
      property summary : String?

      def initialize(
        @type : String,
        @actor : String,
        @id : String? = nil,
        @context : Array(String)? = nil,
        @object : JSON::Any? = nil,
        @to : Array(String)? = nil,
        @cc : Array(String)? = nil,
        @published : String? = nil,
        @summary : String? = nil
      )
      end
    end

    # ActivityPub Collection
    struct OrderedCollection
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      property context : Array(String)

      property type : String
      property id : String

      @[JSON::Field(key: "totalItems")]
      property total_items : Int32

      @[JSON::Field(key: "orderedItems")]
      property ordered_items : Array(JSON::Any)

      property first : String?
      property last : String?

      def initialize(
        @id : String,
        @ordered_items : Array(JSON::Any) = [] of JSON::Any,
        @context : Array(String) = FULL_CONTEXT,
        @type : String = "OrderedCollection",
        @first : String? = nil,
        @last : String? = nil
      )
        @total_items = @ordered_items.size
      end
    end
  end
end
