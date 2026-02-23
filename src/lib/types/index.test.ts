// Type compilation tests for OKR-014 types
// These tests verify that the type definitions compile correctly.

import type { ActivityPubActor, ActivityPubActivity, ActivityPubObject, ActivityPubCollection } from '../activitypub/types.js';
import type { ForgeFedTicket, ForgeFedKeyResult, ForgeFedGrant, OKRQuarter, OKRStatus, OKRTargetType } from '../forgefed/types.js';
import type { OrgHeadline, OrgProperty, OrgPropertyDrawer, OrgFile } from '../org-mode/types.js';
import { isOrgHeadline, isOrgProperty, isOrgPropertyDrawer, isOrgFile } from '../org-mode/types.js';

// ActivityPub types should compile
const actor: ActivityPubActor = {
	'@context': 'https://www.w3.org/ns/activitystreams',
	id: 'https://example.com/users/alice',
	type: 'Person',
	inbox: 'https://example.com/users/alice/inbox',
	outbox: 'https://example.com/users/alice/outbox',
	followers: 'https://example.com/users/alice/followers',
	following: 'https://example.com/users/alice/following',
	endpoints: {
		oauthAuthorizationEndpoint: 'https://example.com/oauth/authorize',
		oauthTokenEndpoint: 'https://example.com/oauth/token'
	}
};

const activity: ActivityPubActivity = {
	'@context': 'https://www.w3.org/ns/activitystreams',
	id: 'https://example.com/activities/1',
	type: 'Create',
	actor: actor.id,
	object: 'https://example.com/notes/1',
	to: ['https://www.w3.org/ns/activitystreams#Public'],
	cc: ['https://example.com/users/alice/followers'],
	published: new Date().toISOString()
};

const object: ActivityPubObject = {
	id: 'https://example.com/notes/1',
	type: 'Note',
	attributedTo: actor.id,
	content: 'Hello ActivityPub!',
	published: new Date().toISOString()
};

const collection: ActivityPubCollection = {
	'@context': 'https://www.w3.org/ns/activitystreams',
	id: 'https://example.com/users/alice/followers',
	type: 'Collection',
	totalItems: 0,
	items: []
};

// ForgeFed types should compile
const quarter: OKRQuarter = 'Q1';
const okrStatus: OKRStatus = 'active';
const targetType: OKRTargetType = 'number';

const ticket: ForgeFedTicket = {
	id: 'https://example.com/tickets/1',
	type: 'Ticket',
	ticketsTrackedBy: 'https://example.com/repo',
	'okr:quarter': quarter,
	'okr:year': 2026,
	'okr:status': okrStatus,
	'okr:progress': 50,
	'okr:keyResults': ['https://example.com/tickets/2'],
	isResolved: false
};

const keyResult: ForgeFedKeyResult = {
	...ticket,
	'okr:targetType': targetType,
	'okr:targetValue': 100,
	'okr:currentValue': 50,
	'okr:unit': 'tasks',
	'okr:weight': 1.0
};

const grant: ForgeFedGrant = {
	type: 'Grant',
	id: 'https://example.com/grants/1',
	context: 'https://example.com/repo',
	target: 'https://example.com/users/alice',
	allows: ['read', 'write'],
	role: 'contributor',
	result: 'https://example.com/grants/1/result'
};

// Org Mode types should compile
const headline: OrgHeadline = {
	type: 'headline',
	level: 1,
	title: [{ type: 'text' }],
	tags: ['TODO'],
	children: []
};

const property: OrgProperty = {
	type: 'property',
	key: 'ID',
	value: 'abc-123'
};

const drawer: OrgPropertyDrawer = {
	type: 'property-drawer',
	children: [property]
};

const file: OrgFile = {
	type: 'org-data',
	children: [headline],
	keywords: { TITLE: 'Test File' }
};

// Type guards should work
const headlineNode = { type: 'headline' as const, level: 1, title: [] };
console.assert(isOrgHeadline(headlineNode), 'isOrgHeadline should return true');
console.assert(!isOrgProperty(headlineNode), 'isOrgProperty should return false for headline');
console.assert(isOrgProperty(property), 'isOrgProperty should return true for property');
console.assert(isOrgPropertyDrawer(drawer), 'isOrgPropertyDrawer should return true for drawer');
console.assert(isOrgFile(file), 'isOrgFile should return true for file');

// Suppress unused variable warnings
void actor; void activity; void object; void collection;
void ticket; void keyResult; void grant;
void headline; void drawer; void file;
void quarter; void okrStatus; void targetType;
