// ============================================================
// Project Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
//
// Current: Neon PostgreSQL via Drizzle ORM
// ============================================================

import { db } from '@/lib/db';
import { projects, tasks, users } from '@/lib/db/schema';
import { eq, and, desc, asc, ilike, count, sql } from 'drizzle-orm';
import type {
  ProjectFilters,
  ProjectsResponse,
  ProjectResponse,
  ProjectCreatePayload,
  TaskMutationPayload,
  Task
} from './types';

// Helper: convert Drizzle row dates to ISO strings
function serializeProject(row: typeof projects.$inferSelect) {
  return {
    ...row,
    description: row.description ?? '',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
  };
}

function serializeTask(row: typeof tasks.$inferSelect) {
  return {
    ...row,
    description: row.description ?? '',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
  };
}

// ============================================================================
// Project Operations
// ============================================================================

export async function getProjects(filters: ProjectFilters): Promise<ProjectsResponse> {
  const { userId, page = 1, limit = 50, search, sort } = filters;

  const conditions = [eq(projects.userId, userId)];

  if (search) {
    conditions.push(ilike(projects.name, `%${search}%`));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  // Sort
  const orderFn = sort === 'name' ? asc(projects.name) : desc(projects.updatedAt);

  // Count
  const [totalResult] = await db.select({ value: count() }).from(projects).where(where);

  const total = totalResult?.value ?? 0;

  // Fetch
  const rows = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(orderFn)
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    success: true,
    data: rows.map(serializeProject) as any,
    total,
    page,
    limit,
    message: 'Projects fetched successfully'
  };
}

export async function getProjectById(id: string): Promise<ProjectResponse> {
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

  if (!row) {
    return { success: false, data: null, message: 'Project not found' };
  }

  return { success: true, data: serializeProject(row) as any, message: 'Project found' };
}

export async function getProjectBySlug(userId: string, slug: string): Promise<ProjectResponse> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.slug, slug)))
    .limit(1);

  if (!row) {
    return { success: false, data: null, message: 'Project not found' };
  }

  return { success: true, data: serializeProject(row) as any, message: 'Project found' };
}

export async function getPublicProject(
  username: string,
  slug: string
): Promise<ProjectResponse & { tasks?: Task[] }> {
  // Find user by username
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user) {
    return { success: false, data: null, message: 'User not found' };
  }

  // Find project by userId + slug
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, user.id), eq(projects.slug, slug)))
    .limit(1);

  if (!row) {
    return { success: false, data: null, message: 'Project not found' };
  }

  // Fetch tasks
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, row.id))
    .orderBy(asc(tasks.position));

  return {
    success: true,
    data: serializeProject(row) as any,
    tasks: taskRows.map(serializeTask) as Task[],
    message: 'Project found'
  };
}

export async function createProject(
  userId: string,
  data: ProjectCreatePayload
): Promise<ProjectResponse> {
  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

  // Check for duplicate slug
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.slug, slug)))
    .limit(1);

  if (existing) {
    return { success: false, data: null, message: 'A project with this slug already exists' };
  }

  const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  await db.insert(projects).values({
    id: projectId,
    userId,
    name: data.name,
    slug,
    description: data.description || ''
  });

  // Create initial tasks if provided
  if (data.tasks && data.tasks.length > 0) {
    for (let i = 0; i < data.tasks.length; i++) {
      const taskData = data.tasks[i];
      await db.insert(tasks).values({
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        projectId,
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'pending',
        position: i
      });
    }
    await recalculateProgress(projectId);
  }

  return getProjectById(projectId);
}

export async function updateProject(
  id: string,
  data: Partial<ProjectCreatePayload>
): Promise<ProjectResponse> {
  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

  if (!existing) {
    return { success: false, data: null, message: 'Project not found' };
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.slug !== undefined) updates.slug = data.slug;

  await db.update(projects).set(updates).where(eq(projects.id, id));

  return getProjectById(id);
}

export async function deleteProject(id: string) {
  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

  if (!existing) {
    return { success: false, data: null, message: 'Project not found' };
  }

  // Delete tasks first
  await db.delete(tasks).where(eq(tasks.projectId, id));
  // Delete project
  await db.delete(projects).where(eq(projects.id, id));

  return { success: true, data: null, message: 'Project deleted successfully' };
}

// ============================================================================
// Task Operations
// ============================================================================

export async function getTasks(projectId: string): Promise<Task[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position));

  return rows.map(serializeTask) as Task[];
}

export async function createTask(projectId: string, data: TaskMutationPayload): Promise<Task> {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Get max position
  const [maxPos] = await db
    .select({ value: sql<number>`coalesce(max(${tasks.position}), 0)` })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  await db.insert(tasks).values({
    id: taskId,
    projectId,
    title: data.title,
    description: data.description || '',
    status: data.status || 'pending',
    position: (maxPos?.value ?? 0) + 1
  });

  const [row] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  await recalculateProgress(projectId);

  return serializeTask(row!) as Task;
}

export async function updateTask(id: string, data: Partial<TaskMutationPayload>): Promise<Task> {
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

  if (!existing) {
    throw new Error('Task not found');
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;

  await db.update(tasks).set(updates).where(eq(tasks.id, id));

  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  await recalculateProgress(existing.projectId);

  return serializeTask(row!) as Task;
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

  if (!existing) {
    throw new Error('Task not found');
  }

  await db.update(tasks).set({ status, updatedAt: new Date() }).where(eq(tasks.id, id));

  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  await recalculateProgress(existing.projectId);

  return serializeTask(row!) as Task;
}

export async function deleteTask(id: string) {
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

  if (!existing) {
    throw new Error('Task not found');
  }

  await db.delete(tasks).where(eq(tasks.id, id));
  await recalculateProgress(existing.projectId);
}

export async function reorderTasks(projectId: string, taskIds: string[]): Promise<Task[]> {
  for (let i = 0; i < taskIds.length; i++) {
    await db
      .update(tasks)
      .set({ position: i, updatedAt: new Date() })
      .where(eq(tasks.id, taskIds[i]));
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position));

  return rows.map(serializeTask) as Task[];
}

// ============================================================================
// Helpers
// ============================================================================

async function recalculateProgress(projectId: string) {
  const [result] = await db
    .select({
      total: count(),
      completed: sql<number>`sum(case when ${tasks.status} = 'completed' then 1 else 0 end)::int`
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const totalTasks = result?.total ?? 0;
  const completedTasks = result?.completed ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  await db
    .update(projects)
    .set({ totalTasks, completedTasks, progress, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
}
