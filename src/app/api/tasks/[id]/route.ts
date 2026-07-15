import { db } from '@/lib/db';
import { tasks, projects } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;

  await db.update(tasks).set(updates).where(eq(tasks.id, id));

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  await db.delete(tasks).where(eq(tasks.id, id));
  await recalculateProgress(existing.projectId);

  return NextResponse.json({ success: true, message: 'Deleted' });
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
