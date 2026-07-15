export type { Project, ProjectFilters } from '@/constants/mock-api-projects';
export type { TaskStatus } from '@/constants/mock-api-projects';

import type { Project, TaskStatus } from '@/constants/mock-api-projects';

export type ProjectsResponse = {
  success: boolean;
  data: Project[];
  total: number;
  page: number;
  limit: number;
  message: string;
};

export type ProjectResponse = {
  success: boolean;
  data: Project | null;
  message: string;
};

export type ProjectWithTasks = Project & {
  tasks: Task[];
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskMutationPayload = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

export type ProjectCreatePayload = {
  name: string;
  slug?: string;
  description?: string;
  tasks?: TaskMutationPayload[];
};
