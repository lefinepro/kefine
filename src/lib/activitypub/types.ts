// ActivityPub type definitions
// https://www.w3.org/TR/activitypub/

export type ActivityPubContext = string | object | (string | object)[];

export interface ActorEndpoints {
	oauthAuthorizationEndpoint?: string;
	oauthTokenEndpoint?: string;
	provideClientKey?: string;
	signClientKey?: string;
}

export interface ActivityPubActor {
	'@context': ActivityPubContext;
	id: string;
	type: string;
	inbox: string;
	outbox: string;
	followers?: string;
	following?: string;
	endpoints?: ActorEndpoints;
}

export interface ActivityPubActivity {
	'@context': ActivityPubContext;
	id: string;
	type: string;
	actor: string;
	object: string | ActivityPubObject;
	to?: string[];
	cc?: string[];
	published?: string;
}

export interface ActivityPubObject {
	'@context'?: ActivityPubContext;
	id: string;
	type: string;
	attributedTo?: string;
	content?: string;
	published?: string;
}

export interface ActivityPubCollection {
	'@context': ActivityPubContext;
	id: string;
	type: string;
	totalItems: number;
	items: ActivityPubObject[];
}
