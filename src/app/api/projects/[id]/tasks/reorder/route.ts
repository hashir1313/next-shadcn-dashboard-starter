import { db } from '@/lib/db';
import { tasks, projects } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const body = await request.json();
  const { taskIds } = body;

  if (!Array.isArray(taskIds)) {
    return NextResponse.json(
      { success: false, message: 'taskIds array required' },
      { status: 400 }
    );
  }

  for (let i = 0; i < taskIds.length; i++) {
    await db
      .update(tasks)
      .set({ position: i, updatedAt: new Date() })
      .where(eq(tasks.id, taskIds[i]));
  }

  // Recalculate progress
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

  return NextResponse.json({ success: true, message: 'Reordered' });
}
