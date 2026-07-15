import { queryOptions } from '@tanstack/react-query';
import {
  getProjects,
  getProjectById,
  getProjectBySlug,
  getTasks,
  getPublicProject
} from './service';
import type { ProjectFilters } from './types';

export type { Project, ProjectFilters } from './types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.all, 'list', filters] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  slug: (userId: string, slug: string) => [...projectKeys.all, 'slug', userId, slug] as const,
  tasks: (projectId: string) => [...projectKeys.all, 'tasks', projectId] as const,
  public: (username: string, slug: string) =>
    [...projectKeys.all, 'public', username, slug] as const
};

export const projectsQueryOptions = (filters: ProjectFilters) =>
  queryOptions({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(filters)
  });

export const projectByIdOptions = (id: string) =>
  queryOptions({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProjectById(id)
  });

export const projectBySlugOptions = (userId: string, slug: string) =>
  queryOptions({
    queryKey: projectKeys.slug(userId, slug),
    queryFn: () => getProjectBySlug(userId, slug)
  });

export const tasksQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: projectKeys.tasks(projectId),
    queryFn: () => getTasks(projectId)
  });

export const publicProjectOptions = (username: string, slug: string) =>
  queryOptions({
    queryKey: projectKeys.public(username, slug),
    queryFn: () => getPublicProject(username, slug)
  });
