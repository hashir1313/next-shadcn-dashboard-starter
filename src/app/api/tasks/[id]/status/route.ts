import { db } from '@/lib/db';
import { tasks, projects } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  await db
    .update(tasks)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(tasks.id, id));

  await recalculateProgress(existing.projectId);

  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return NextResponse.json({
    success: true,
    data: {
      ...row!,
      description: row!.description ?? '',
      createdAt: row!.createdAt.toISOString(),
      updatedAt: row!.updatedAt.toISOString()
    },
    message: 'Updated'
  });
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
