/**
 * ActivityPub type definitions
 * Based on the ActivityPub W3C specification: https://www.w3.org/TR/activitypub/
 * OKR-013.2 Task 1.2.1
 */

/** JSON-LD context for ActivityPub */
export type APContext =
  | string
  | string[]
  | Record<string, unknown>
  | (string | Record<string, unknown>)[];

/** ActivityPub Actor types */
export type APActorType =
  | 'Application'
  | 'Group'
  | 'Organization'
  | 'Person'
  | 'Service';

/** ActivityPub Activity types */
export type APActivityType =
  | 'Accept'
  | 'Add'
  | 'Announce'
  | 'Arrive'
  | 'Block'
  | 'Create'
  | 'Delete'
  | 'Dislike'
  | 'Flag'
  | 'Follow'
  | 'Ignore'
  | 'Invite'
  | 'Join'
  | 'Leave'
  | 'Like'
  | 'Listen'
  | 'Move'
  | 'Offer'
  | 'Question'
  | 'Reject'
  | 'Read'
  | 'Remove'
  | 'TentativeReject'
  | 'TentativeAccept'
  | 'Travel'
  | 'Undo'
  | 'Update'
  | 'View';

/** ActivityPub Object types */
export type APObjectType =
  | 'Article'
  | 'Audio'
  | 'Document'
  | 'Event'
  | 'Image'
  | 'Note'
  | 'Page'
  | 'Place'
  | 'Profile'
  | 'Relationship'
  | 'Tombstone'
  | 'Video';

/** Public key for HTTP signatures */
export interface APPublicKey {
  id: string;
  owner: string;
  publicKeyPem: string;
}

/** ActivityPub Actor — represents a user or service */
export interface ActivityPubActor {
  '@context': APContext;
  id: string;
  type: APActorType;
  preferredUsername?: string;
  name?: string;
  summary?: string;
  url?: string;
  inbox: string;
  outbox: string;
  followers?: string;
  following?: string;
  liked?: string;
  publicKey?: APPublicKey;
  endpoints?: {
    sharedInbox?: string;
    oauthAuthorizationEndpoint?: string;
    oauthTokenEndpoint?: string;
    provideClientKey?: string;
    signClientKey?: string;
  };
  icon?: ActivityPubObject;
  image?: ActivityPubObject;
  manuallyApprovesFollowers?: boolean;
  published?: string;
  updated?: string;
}

/** ActivityPub Object — base type for content objects */
export interface ActivityPubObject {
  '@context'?: APContext;
  id?: string;
  type: APObjectType | string;
  attributedTo?: string | ActivityPubActor;
  content?: string;
  mediaType?: string;
  name?: string;
  summary?: string;
  url?: string | string[];
  to?: string | string[];
  cc?: string | string[];
  bto?: string | string[];
  bcc?: string | string[];
  audience?: string | string[];
  inReplyTo?: string | ActivityPubObject;
  replies?: ActivityPubCollection<ActivityPubObject>;
  likes?: ActivityPubCollection<ActivityPubActivity>;
  shares?: ActivityPubCollection<ActivityPubActivity>;
  attachment?: ActivityPubObject[];
  tag?: ActivityPubObject[];
  published?: string;
  updated?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
}

/** ActivityPub Activity — represents an action performed by an actor */
export interface ActivityPubActivity extends Omit<ActivityPubObject, 'type'> {
  type: APActivityType | string;
  actor: string | ActivityPubActor;
  object?: string | ActivityPubObject | ActivityPubActivity;
  target?: string | ActivityPubObject | ActivityPubCollection<ActivityPubObject>;
  result?: string | ActivityPubObject;
  origin?: string | ActivityPubObject;
  instrument?: string | ActivityPubObject;
}

/** ActivityPub Collection — ordered or unordered set of objects */
export interface ActivityPubCollection<T = ActivityPubObject> {
  '@context'?: APContext;
  id?: string;
  type: 'Collection' | 'OrderedCollection' | 'CollectionPage' | 'OrderedCollectionPage';
  totalItems?: number;
  items?: T[];
  orderedItems?: T[];
  first?: string | ActivityPubCollection<T>;
  last?: string | ActivityPubCollection<T>;
  next?: string | ActivityPubCollection<T>;
  prev?: string | ActivityPubCollection<T>;
  partOf?: string | ActivityPubCollection<T>;
}

/** ActivityPub Link — reference to a resource */
export interface ActivityPubLink {
  '@context'?: APContext;
  type: 'Link' | 'Mention';
  href: string;
  rel?: string | string[];
  mediaType?: string;
  name?: string;
  hreflang?: string;
  height?: number;
  width?: number;
  preview?: ActivityPubObject | ActivityPubLink;
}

export type APObjectOrLink = ActivityPubObject | ActivityPubLink | string;
