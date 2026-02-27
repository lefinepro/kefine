// Type aliases for union types (no enums)
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type ObjectiveStatus = 'active' | 'completed' | 'archived';
export type TargetType = 'number' | 'percentage' | 'boolean';
export type LinkType = 'objective' | 'keyresult';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface Objective {
  id: string;
  title: string;
  description?: string;
  quarter: Quarter;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  status: ObjectiveStatus;
}

export interface KeyResult {
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

export interface OKRLink {
  id: string;
  taskId: string;
  objectiveId?: string;
  keyResultId?: string;
  linkType: LinkType;
  createdAt: Date;
}

export interface RepositoryLink {
  id: string;
  url: string;
  name?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // ISO date string YYYY-MM-DD
  dueTime?: string; // HH:MM
  repositoryLinks?: RepositoryLink[];
  createdAt: Date;
  updatedAt: Date;
  okrLinks: OKRLink[];
}
