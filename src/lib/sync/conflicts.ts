/**
 * Conflict detection and resolution for AP sync
 * OKR-013.19 Task 6.19.4 / Task 6.19.5
 */

import type { Conflict, ObjectiveModel, KeyResultModel, TaskModel } from '../../types/models';

/** Conflict resolution strategies */
export type ConflictStrategy = 'last-write-wins' | 'local-wins' | 'remote-wins' | 'manual';

/**
 * Detect conflicts between a local and remote version of an object
 * OKR-013.19 Task 6.19.4
 *
 * @param local - Local version
 * @param remote - Remote version from federation
 * @param type - Type of object
 */
export function detectConflict(
  local: ObjectiveModel | KeyResultModel | TaskModel,
  remote: ObjectiveModel | KeyResultModel | TaskModel,
  type: Conflict['type']
): Conflict | null {
  const conflictingFields: string[] = [];

  // Only consider a conflict if both sides have been modified after the last sync
  const localUpdated = local.updatedAt?.getTime() ?? 0;
  const remoteUpdated = remote.updatedAt?.getTime() ?? 0;

  if (localUpdated <= remoteUpdated) {
    // Remote is newer — no local conflict
    return null;
  }

  // Compare common fields shared by all object types
  if (local.title !== remote.title) conflictingFields.push('title');
  if (local.description !== remote.description) conflictingFields.push('description');

  // Type-specific checks
  if (type === 'objective') {
    const localObj = local as ObjectiveModel;
    const remoteObj = remote as ObjectiveModel;
    if (localObj.quarter !== remoteObj.quarter) conflictingFields.push('quarter');
    if (localObj.year !== remoteObj.year) conflictingFields.push('year');
  } else if (type === 'keyResult') {
    const localKR = local as KeyResultModel;
    const remoteKR = remote as KeyResultModel;
    if (localKR.currentValue !== remoteKR.currentValue) conflictingFields.push('currentValue');
    if (localKR.targetValue !== remoteKR.targetValue) conflictingFields.push('targetValue');
  }

  if (conflictingFields.length === 0) return null;

  return {
    objectId: local.id,
    type,
    local,
    remote,
    conflictingFields,
    detectedAt: new Date()
  };
}

/**
 * Resolve a conflict using the given strategy
 * OKR-013.19 Task 6.19.5
 *
 * @param conflict - The conflict to resolve
 * @param strategy - Resolution strategy
 * @returns The resolved object to use
 */
export function resolveConflict(
  conflict: Conflict,
  strategy: ConflictStrategy
): ObjectiveModel | KeyResultModel | TaskModel {
  switch (strategy) {
    case 'last-write-wins': {
      const localTime = conflict.local.updatedAt?.getTime() ?? 0;
      const remoteTime = conflict.remote.updatedAt?.getTime() ?? 0;
      return localTime >= remoteTime ? conflict.local : conflict.remote;
    }
    case 'local-wins':
      return conflict.local;
    case 'remote-wins':
      return conflict.remote;
    case 'manual':
      // Manual resolution — return local by default (user must resolve explicitly)
      return conflict.local;
  }
}

/**
 * Merge two objects field by field, taking non-conflicting remote updates
 * For conflicting fields, falls back to local values.
 *
 * @param local - Local version
 * @param remote - Remote version
 * @param conflictingFields - Fields that conflict (keep local)
 */
export function mergeObjects<T extends Record<string, unknown>>(
  local: T,
  remote: T,
  conflictingFields: string[]
): T {
  const conflictSet = new Set(conflictingFields);
  const merged = { ...remote };

  for (const field of conflictSet) {
    // Keep local value for conflicting fields
    (merged as Record<string, unknown>)[field] = local[field];
  }

  return merged as T;
}
