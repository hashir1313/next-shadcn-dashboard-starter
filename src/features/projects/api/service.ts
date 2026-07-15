// ============================================================
// Project Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
//
// Current: API Routes (BFF pattern — client calls /api/*, server talks to Neon)
// ============================================================

import { apiClient } from '@/lib/api-client';
import type {
  ProjectFilters,
  ProjectsResponse,
  ProjectResponse,
  ProjectCreatePayload,
  TaskMutationPayload,
  Task
} from './types';

// ============================================================================
// Project Operations
// ============================================================================

export async function getProjects(filters: ProjectFilters): Promise<ProjectsResponse> {
  const params = new URLSearchParams({
    userId: filters.userId,
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 50)
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);

  return apiClient<ProjectsResponse>(`/projects?${params}`);
}

export async function getProjectById(id: string): Promise<ProjectResponse> {
  return apiClient<ProjectResponse>(`/projects/${id}`);
}

export async function getProjectBySlug(userId: string, slug: string): Promise<ProjectResponse> {
  const params = new URLSearchParams({ userId, slug });
  // Use the list endpoint filtered by slug since we don't have a dedicated slug route
  const res = await apiClient<ProjectsResponse>(`/projects?${params}`);
  const project = res.data.find((p) => p.slug === slug) ?? null;
  return { success: !!project, data: project, message: project ? 'OK' : 'Not found' };
}

export async function getPublicProject(
  username: string,
  slug: string
): Promise<ProjectResponse & { tasks?: Task[] }> {
  return apiClient<ProjectResponse & { tasks?: Task[] }>(`/public/${username}/${slug}`);
}

export async function createProject(
  userId: string,
  data: ProjectCreatePayload
): Promise<ProjectResponse> {
  return apiClient<ProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify({ userId, ...data })
  });
}

export async function updateProject(
  id: string,
  data: Partial<ProjectCreatePayload>
): Promise<ProjectResponse> {
  return apiClient<ProjectResponse>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProject(id: string) {
  return apiClient<{ success: boolean; message: string }>(`/projects/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// Task Operations
// ============================================================================

export async function getTasks(projectId: string): Promise<Task[]> {
  return apiClient<Task[]>(`/projects/${projectId}/tasks`);
}

export async function createTask(projectId: string, data: TaskMutationPayload): Promise<Task> {
  return apiClient<Task>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateTask(id: string, data: Partial<TaskMutationPayload>): Promise<Task> {
  return apiClient<{ success: boolean; data: Task }>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }).then((r) => r.data);
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  return apiClient<{ success: boolean; data: Task }>(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }).then((r) => r.data);
}

export async function deleteTask(id: string) {
  return apiClient<{ success: boolean; message: string }>(`/tasks/${id}`, {
    method: 'DELETE'
  });
}

export async function reorderTasks(projectId: string, taskIds: string[]): Promise<Task[]> {
  return apiClient<Task[]>(`/projects/${projectId}/tasks/reorder`, {
    method: 'POST',
    body: JSON.stringify({ taskIds })
  });
}
