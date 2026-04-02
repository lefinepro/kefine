export interface Project {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  sourceRepository?: string;
  issueTracker?: string;
  administrators: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CreateProjectRequest {
  name: string;
  summary?: string;
  description?: string;
  sourceRepository?: string;
  issueTracker?: string;
  administrators?: string[];
  metadata?: Record<string, unknown>;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;
