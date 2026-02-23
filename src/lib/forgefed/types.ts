// ForgeFed type definitions
// https://forgefed.org/

import type { ActivityPubObject } from '../activitypub/types.js';

// OKR quarter type (union type, no enums per project conventions)
export type OKRQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

// OKR status type (union type, no enums per project conventions)
export type OKRStatus = 'active' | 'completed' | 'archived';

// OKR target type (union type, no enums per project conventions)
export type OKRTargetType = 'number' | 'percentage' | 'boolean';

export interface ForgeFedTicket extends ActivityPubObject {
	ticketsTrackedBy: string;
	'okr:quarter'?: OKRQuarter;
	'okr:year'?: number;
	'okr:status'?: OKRStatus;
	'okr:progress'?: number;
	'okr:keyResults'?: string[];
	isResolved?: boolean;
}

export interface ForgeFedKeyResult extends ForgeFedTicket {
	'okr:targetType': OKRTargetType;
	'okr:targetValue': number;
	'okr:currentValue': number;
	'okr:unit': string;
	'okr:weight'?: number;
}

export interface ForgeFedGrant {
	type: string;
	id: string;
	context: string;
	target: string;
	delegates?: string;
	allows: string[];
	role: string;
	startTime?: string;
	endTime?: string;
	result: string;
}
