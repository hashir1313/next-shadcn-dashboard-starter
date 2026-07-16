import { db } from '@/lib/db';
import { projects, tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

  if (!row) {
    return NextResponse.json({ success: false, data: null, message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...row,
      description: row.description ?? '',
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    },
    message: 'OK'
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.slug !== undefined) {
    // Check slug uniqueness within the same user's projects
    const [slugConflict] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.userId, existing.userId), eq(projects.slug, body.slug)))
      .limit(1);

    if (slugConflict && slugConflict.id !== id) {
      return NextResponse.json(
        { success: false, message: 'A project with this slug already exists' },
        { status: 409 }
      );
    }
    updates.slug = body.slug;
  }

  await db.update(projects).set(updates).where(eq(projects.id, id));

  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
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
  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  await db.delete(tasks).where(eq(tasks.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));

  return NextResponse.json({ success: true, message: 'Deleted' });
}
