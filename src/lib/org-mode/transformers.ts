/**
 * Org mode ↔ OKR model transformers
 * OKR-013.17 Task 5.17.1 / Task 5.17.2 / Task 5.17.3
 *
 * Converts between Org mode AST/files and the internal OKR data model.
 */

import type { OrgDocument, OrgFile } from '../../types/org';
import type { OKRModel, ObjectiveModel, KeyResultModel, TaskModel } from '../../types/models';
import type { Quarter, TargetType } from '$lib/types/okr';
import { parseOrgFile, serializeOrgFile } from './processor';
import {
  findHeadlines,
  extractProperties,
  getHeadlineContent
} from './headlines';

// --- Org → OKR Model ---

/**
 * Transform a parsed Org file into an OKR model
 * OKR-013.17 Task 5.17.1
 *
 * Expects the following Org structure:
 *
 * #+TITLE: Q1 2026 OKRs
 * * Objective Title          :okr:
 *   :PROPERTIES:
 *   :OKR_ID: <uuid>
 *   :QUARTER: Q1
 *   :YEAR: 2026
 *   :STATUS: active
 *   :END:
 *   Description text...
 *   ** Key Result Title       :kr:
 *      :PROPERTIES:
 *      :KR_ID: <uuid>
 *      :TARGET_TYPE: percentage
 *      :TARGET_VALUE: 100
 *      :CURRENT_VALUE: 50
 *      :UNIT: %
 *      :WEIGHT: 1
 *      :END:
 *
 * @param orgFile - The parsed Org file
 */
export function orgToOKRModel(orgFile: OrgFile): OKRModel {
  const { ast, keywords } = orgFile;

  // Extract file metadata
  const quarter = (keywords['QUARTER'] ?? 'Q1') as Quarter;
  const year = parseInt(keywords['YEAR'] ?? String(new Date().getFullYear()), 10);
  const title = keywords['TITLE'] ?? '';
  const description = keywords['DESCRIPTION'] ?? '';

  const objectives: ObjectiveModel[] = [];
  const keyResults: KeyResultModel[] = [];
  const tasks: TaskModel[] = [];

  // Find all level-1 headlines tagged :okr: as objectives
  const objectiveHeadlines = findHeadlines(ast.children, { level: 1, tags: ['okr'] });

  for (const objHl of objectiveHeadlines) {
    const props = extractProperties(objHl);
    const content = getHeadlineContent(objHl);

    const objective: ObjectiveModel = {
      id: props['OKR_ID'] ?? crypto.randomUUID(),
      title: objHl.title,
      description: content || props['DESCRIPTION'],
      quarter: (props['QUARTER'] as Quarter) ?? quarter,
      year: parseInt(props['YEAR'] ?? String(year), 10),
      status: (props['STATUS'] as ObjectiveModel['status']) ?? 'active',
      createdAt: props['CREATED_AT'] ? new Date(props['CREATED_AT']) : new Date(),
      updatedAt: props['UPDATED_AT'] ? new Date(props['UPDATED_AT']) : new Date(),
      apId: props['AP_ID'],
      ticketTrackerUrl: props['TICKET_TRACKER_URL']
    };

    objectives.push(objective);

    // Find key results tagged :kr: within the objective
    const krHeadlines = findHeadlines(objHl.children, { tags: ['kr'] });
    for (const krHl of krHeadlines) {
      const krProps = extractProperties(krHl);
      const krContent = getHeadlineContent(krHl);

      const kr: KeyResultModel = {
        id: krProps['KR_ID'] ?? crypto.randomUUID(),
        objectiveId: objective.id,
        title: krHl.title,
        description: krContent || krProps['DESCRIPTION'],
        targetType: (krProps['TARGET_TYPE'] as TargetType) ?? 'number',
        targetValue: parseFloat(krProps['TARGET_VALUE'] ?? '100'),
        currentValue: parseFloat(krProps['CURRENT_VALUE'] ?? '0'),
        unit: krProps['UNIT'] ?? '',
        weight: parseFloat(krProps['WEIGHT'] ?? '1'),
        createdAt: krProps['CREATED_AT'] ? new Date(krProps['CREATED_AT']) : new Date(),
        updatedAt: krProps['UPDATED_AT'] ? new Date(krProps['UPDATED_AT']) : new Date(),
        apId: krProps['AP_ID'],
        parentTicketId: krProps['PARENT_TICKET_ID']
      };

      keyResults.push(kr);
    }

    // Find tasks tagged :task: within the objective
    const taskHeadlines = findHeadlines(objHl.children, { tags: ['task'] });
    for (const taskHl of taskHeadlines) {
      const taskProps = extractProperties(taskHl);
      const taskContent = getHeadlineContent(taskHl);

      const task: TaskModel = {
        id: taskProps['TASK_ID'] ?? crypto.randomUUID(),
        title: taskHl.title,
        description: taskContent || taskProps['DESCRIPTION'],
        status: todoKeywordToTaskStatus(taskHl.todoKeyword),
        priority: (taskProps['PRIORITY'] as TaskModel['priority']) ?? 'medium',
        createdAt: taskProps['CREATED_AT'] ? new Date(taskProps['CREATED_AT']) : new Date(),
        updatedAt: taskProps['UPDATED_AT'] ? new Date(taskProps['UPDATED_AT']) : new Date(),
        okrLinks: [{
          id: crypto.randomUUID(),
          taskId: taskProps['TASK_ID'] ?? '',
          objectiveId: objective.id,
          linkType: 'objective',
          createdAt: new Date()
        }],
        apId: taskProps['AP_ID'],
        ffStatus: taskProps['FF_STATUS'] as TaskModel['ffStatus']
      };

      tasks.push(task);
    }
  }

  return {
    objectives,
    keyResults,
    tasks,
    okrLinks: tasks.flatMap((t) => t.okrLinks),
    metadata: {
      quarter,
      year,
      title,
      description,
      lastModified: new Date()
    }
  };
}

/**
 * Transform an OKR model into an Org document AST
 * OKR-013.17 Task 5.17.2
 *
 * @param model - The OKR model to serialize
 */
export function okrModelToOrg(model: OKRModel): OrgDocument {
  const children = [];

  // File keywords
  if (model.metadata.title) {
    children.push({ type: 'keyword', key: 'TITLE', value: model.metadata.title });
  }
  if (model.metadata.quarter) {
    children.push({ type: 'keyword', key: 'QUARTER', value: model.metadata.quarter });
  }
  if (model.metadata.year) {
    children.push({ type: 'keyword', key: 'YEAR', value: String(model.metadata.year) });
  }

  // Objectives
  for (const obj of model.objectives) {
    const objKeyResults = model.keyResults.filter((kr) => kr.objectiveId === obj.id);
    const objTasks = model.tasks.filter((t) =>
      t.okrLinks.some((link) => link.objectiveId === obj.id)
    );

    const sectionChildren = [];

    // Property drawer
    const props: Array<{ type: string; key: string; value: string }> = [
      { type: 'node-property', key: 'OKR_ID', value: obj.id },
      { type: 'node-property', key: 'QUARTER', value: obj.quarter },
      { type: 'node-property', key: 'YEAR', value: String(obj.year) },
      { type: 'node-property', key: 'STATUS', value: obj.status },
      { type: 'node-property', key: 'CREATED_AT', value: obj.createdAt.toISOString() },
      { type: 'node-property', key: 'UPDATED_AT', value: obj.updatedAt.toISOString() }
    ];
    if (obj.apId) props.push({ type: 'node-property', key: 'AP_ID', value: obj.apId });
    if (obj.ticketTrackerUrl) {
      props.push({ type: 'node-property', key: 'TICKET_TRACKER_URL', value: obj.ticketTrackerUrl });
    }

    sectionChildren.push({ type: 'property-drawer', children: props });

    // Description paragraph
    if (obj.description) {
      sectionChildren.push({
        type: 'paragraph',
        children: [{ type: 'text', value: obj.description }]
      });
    }

    // Key Results
    for (const kr of objKeyResults) {
      const krProps: Array<{ type: string; key: string; value: string }> = [
        { type: 'node-property', key: 'KR_ID', value: kr.id },
        { type: 'node-property', key: 'TARGET_TYPE', value: kr.targetType },
        { type: 'node-property', key: 'TARGET_VALUE', value: String(kr.targetValue) },
        { type: 'node-property', key: 'CURRENT_VALUE', value: String(kr.currentValue) },
        { type: 'node-property', key: 'UNIT', value: kr.unit },
        { type: 'node-property', key: 'WEIGHT', value: String(kr.weight) },
        { type: 'node-property', key: 'CREATED_AT', value: kr.createdAt.toISOString() },
        { type: 'node-property', key: 'UPDATED_AT', value: kr.updatedAt.toISOString() }
      ];
      if (kr.apId) krProps.push({ type: 'node-property', key: 'AP_ID', value: kr.apId });

      const krChildren = [
        { type: 'section', children: [{ type: 'property-drawer', children: krProps }] }
      ];

      if (kr.description) {
        (krChildren[0] as { type: string; children: unknown[] }).children.push({
          type: 'paragraph',
          children: [{ type: 'text', value: kr.description }]
        });
      }

      sectionChildren.push({
        type: 'headline',
        level: 2,
        title: kr.title,
        tags: ['kr'],
        children: krChildren
      });
    }

    // Tasks
    for (const task of objTasks) {
      const taskProps: Array<{ type: string; key: string; value: string }> = [
        { type: 'node-property', key: 'TASK_ID', value: task.id },
        { type: 'node-property', key: 'PRIORITY', value: task.priority },
        { type: 'node-property', key: 'CREATED_AT', value: task.createdAt.toISOString() },
        { type: 'node-property', key: 'UPDATED_AT', value: task.updatedAt.toISOString() }
      ];
      if (task.apId) taskProps.push({ type: 'node-property', key: 'AP_ID', value: task.apId });

      sectionChildren.push({
        type: 'headline',
        level: 2,
        title: task.title,
        todoKeyword: taskStatusToTodoKeyword(task.status),
        tags: ['task'],
        children: [{ type: 'section', children: [{ type: 'property-drawer', children: taskProps }] }]
      });
    }

    children.push({
      type: 'headline',
      level: 1,
      title: obj.title,
      tags: ['okr'],
      children: [{ type: 'section', children: sectionChildren }]
    });
  }

  return { type: 'org-data', children };
}

/**
 * Parse an Org file string and return the OKR model
 * Convenience wrapper around parseOrgFile + orgToOKRModel
 *
 * @param content - Raw Org file content
 */
export function orgStringToOKRModel(content: string): OKRModel {
  const orgFile = parseOrgFile(content);
  return orgToOKRModel(orgFile);
}

/**
 * Serialize an OKR model to an Org file string
 * Convenience wrapper around okrModelToOrg + serializeOrgFile
 *
 * @param model - The OKR model to serialize
 */
export function okrModelToOrgString(model: OKRModel): string {
  const ast = okrModelToOrg(model);
  return serializeOrgFile(ast);
}

// --- Helpers ---

function todoKeywordToTaskStatus(keyword?: string): TaskModel['status'] {
  switch (keyword) {
    case 'DONE': return 'completed';
    case 'IN-PROGRESS': return 'in_progress';
    default: return 'pending';
  }
}

function taskStatusToTodoKeyword(status: TaskModel['status']): string {
  switch (status) {
    case 'completed': return 'DONE';
    case 'in_progress': return 'IN-PROGRESS';
    default: return 'TODO';
  }
}
