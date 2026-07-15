import { db } from '@/lib/db';
import { tasks, projects } from '@/lib/db/schema';
import { eq, asc, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, id))
    .orderBy(asc(tasks.position));

  const data = rows.map((r) => ({
    ...r,
    description: r.description ?? '',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const body = await request.json();

  const [maxPos] = await db
    .select({ value: sql<number>`coalesce(max(${tasks.position}), 0)` })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  await db.insert(tasks).values({
    id: taskId,
    projectId,
    title: body.title,
    description: body.description || '',
    status: body.status || 'pending',
    position: (maxPos?.value ?? 0) + 1
  });

  await recalculateProgress(projectId);

  const [row] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return NextResponse.json(
    {
      ...row!,
      description: row!.description ?? '',
      createdAt: row!.createdAt.toISOString(),
      updatedAt: row!.updatedAt.toISOString()
    },
    { status: 201 }
  );
}

async function recalculateProgress(projectId: string) {
  const [result] = await db
    .select({
      total: sql<number>`count(*)::int`,
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
