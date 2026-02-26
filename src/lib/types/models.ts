// Internal model types for OKR data
// These are the app-internal representations used across the application

import type { Quarter, ObjectiveStatus, TargetType, TaskStatus, Priority } from './okr.js';

export interface ObjectiveModel {
	id: string;
	title: string;
	description?: string;
	quarter: Quarter;
	year: number;
	status: ObjectiveStatus;
	createdAt: Date;
	updatedAt: Date;
	keyResultIds: string[];
}

export interface KeyResultModel {
	id: string;
	objectiveId: string;
	title: string;
	description?: string;
	targetType: TargetType;
	targetValue: number;
	currentValue: number;
	unit: string;
	weight: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface TaskModel {
	id: string;
	title: string;
	description?: string;
	status: TaskStatus;
	priority: Priority;
	createdAt: Date;
	updatedAt: Date;
	okrLinkIds: string[];
}

export interface OKRModel {
	objective: ObjectiveModel;
	keyResults: KeyResultModel[];
	tasks: TaskModel[];
}
