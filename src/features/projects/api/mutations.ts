import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createProject,
  updateProject,
  deleteProject,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} from './service';
import { projectKeys } from './queries';
import type { ProjectCreatePayload, TaskMutationPayload, Task } from './types';

export const createProjectMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: string; data: ProjectCreatePayload }) =>
    createProject(userId, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const updateProjectMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<ProjectCreatePayload> }) =>
    updateProject(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const deleteProjectMutation = mutationOptions({
  mutationFn: (id: string) => deleteProject(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const createTaskMutation = mutationOptions({
  mutationFn: ({ projectId, data }: { projectId: string; data: TaskMutationPayload }) =>
    createTask(projectId, data),
  onSuccess: (_data: Task, variables) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) });
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const updateTaskMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<TaskMutationPayload> }) =>
    updateTask(id, data),
  onSuccess: (data: Task) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(data.projectId) });
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const updateTaskStatusMutation = mutationOptions({
  mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
    updateTaskStatus(id, status),
  onSuccess: (data: Task) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(data.projectId) });
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const deleteTaskMutation = mutationOptions({
  mutationFn: ({ id, projectId }: { id: string; projectId: string }) => deleteTask(id),
  onSuccess: (_data: void, variables) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) });
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});
