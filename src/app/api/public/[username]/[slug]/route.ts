import { db } from '@/lib/db';
import { projects, tasks, users } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;

  // Find user
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  // Find project
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, user.id), eq(projects.slug, slug)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
  }

  // Tasks
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id))
    .orderBy(asc(tasks.position));

  return NextResponse.json({
    success: true,
    data: {
      ...project,
      description: project.description ?? '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    },
    tasks: taskRows.map((t) => ({
      ...t,
      description: t.description ?? '',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString()
    })),
    freelancer: {
      displayName: user.displayName,
      publicEmail: user.publicEmail,
      logoUrl: user.logoUrl
    },
    message: 'OK'
  });
}
