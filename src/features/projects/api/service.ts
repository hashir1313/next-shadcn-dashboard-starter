// ============================================================
// Project Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
//
// Current: Mock (in-memory fake data for demo/prototyping)
// ============================================================

import { fakeProjects } from '@/constants/mock-api-projects';
import { fakeTasks } from '@/constants/mock-api-tasks';
import type {
  ProjectFilters,
  ProjectsResponse,
  ProjectResponse,
  ProjectCreatePayload,
  TaskMutationPayload,
  Task
} from './types';

async function recalculateProgress(projectId: string) {
  const tasks = await fakeTasks.getTasks(projectId);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  await fakeProjects.updateProjectCounts(projectId, totalTasks, completedTasks);
}

export async function getProjects(filters: ProjectFilters): Promise<ProjectsResponse> {
  return fakeProjects.getProjects(filters);
}

export async function getProjectById(id: string): Promise<ProjectResponse> {
  return fakeProjects.getProjectById(id);
}

export async function getProjectBySlug(userId: string, slug: string): Promise<ProjectResponse> {
  return fakeProjects.getProjectBySlug(userId, slug);
}

export async function getPublicProject(
  username: string,
  slug: string
): Promise<ProjectResponse & { tasks?: Task[] }> {
  const result = await fakeProjects.getPublicProject(username, slug);
  if (result.success && result.data) {
    const tasks = await fakeTasks.getTasks(result.data.id);
    return { ...result, tasks };
  }
  return result;
}

export async function createProject(
  userId: string,
  data: ProjectCreatePayload
): Promise<ProjectResponse> {
  const result = await fakeProjects.createProject(userId, data);
  // Create initial tasks if provided
  if (result.success && result.data && data.tasks && data.tasks.length > 0) {
    for (const taskData of data.tasks) {
      await fakeTasks.createTask(result.data.id, taskData);
    }
    await recalculateProgress(result.data.id);
    // Re-fetch to get updated counts
    return fakeProjects.getProjectById(result.data.id);
  }
  return result;
}

export async function updateProject(
  id: string,
  data: Partial<ProjectCreatePayload>
): Promise<ProjectResponse> {
  return fakeProjects.updateProject(id, data);
}

export async function deleteProject(id: string) {
  return fakeProjects.deleteProject(id);
}

// Task operations
export async function getTasks(projectId: string): Promise<Task[]> {
  return fakeTasks.getTasks(projectId);
}

export async function createTask(projectId: string, data: TaskMutationPayload): Promise<Task> {
  const task = await fakeTasks.createTask(projectId, data);
  await recalculateProgress(projectId);
  return task;
}

export async function updateTask(id: string, data: Partial<TaskMutationPayload>): Promise<Task> {
  const task = await fakeTasks.updateTask(id, data);
  await recalculateProgress(task.projectId);
  return task;
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  const task = await fakeTasks.updateTaskStatus(id, status);
  await recalculateProgress(task.projectId);
  return task;
}

export async function deleteTask(id: string) {
  const task = await fakeTasks.getTaskById(id);
  await fakeTasks.deleteTask(id);
  if (task) {
    await recalculateProgress(task.projectId);
  }
}

export async function reorderTasks(projectId: string, taskIds: string[]): Promise<Task[]> {
  return fakeTasks.reorderTasks(projectId, taskIds);
}
