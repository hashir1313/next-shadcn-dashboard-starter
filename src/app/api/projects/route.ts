import { db } from '@/lib/db';
import { projects, tasks } from '@/lib/db/schema';
import { eq, and, desc, asc, ilike, count, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { canCreateProject } from '@/features/billing/api/service';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
  }

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 50);
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  const conditions = [eq(projects.userId, userId)];
  if (search) {
    conditions.push(ilike(projects.name, `%${search}%`));
  }
  const where = conditions.length === 1 ? conditions[0] : and(...conditions);
  const orderFn = sort === 'name' ? asc(projects.name) : desc(projects.updatedAt);

  const [totalResult] = await db.select({ value: count() }).from(projects).where(where);
  const total = totalResult?.value ?? 0;

  const rows = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(orderFn)
    .limit(limit)
    .offset((page - 1) * limit);

  const data = rows.map((r) => ({
    ...r,
    description: r.description ?? '',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));

  return NextResponse.json({ success: true, data, total, page, limit, message: 'OK' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, name, slug, description, tasks: initialTasks } = body;

  if (!userId || !name) {
    return NextResponse.json(
      { success: false, message: 'userId and name required' },
      { status: 400 }
    );
  }

  // Check project limit for free plan
  const { allowed, current, limit } = await canCreateProject(userId);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `You've reached the limit of ${limit} projects on the Free plan. Upgrade to Pro for unlimited projects.`,
        code: 'PROJECT_LIMIT_REACHED',
        current,
        limit
      },
      { status: 403 }
    );
  }

  const finalSlug =
    slug ||
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

  // Check duplicate
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.slug, finalSlug)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ success: false, message: 'Slug already exists' }, { status: 409 });
  }

  const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  await db.insert(projects).values({
    id: projectId,
    userId,
    name,
    slug: finalSlug,
    description: description || ''
  });

  // Initial tasks
  if (initialTasks && Array.isArray(initialTasks) && initialTasks.length > 0) {
    for (let i = 0; i < initialTasks.length; i++) {
      await db.insert(tasks).values({
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        projectId,
        title: initialTasks[i].title,
        description: initialTasks[i].description || '',
        status: initialTasks[i].status || 'pending',
        position: i
      });
    }
    await recalculateProgress(projectId);
  }

  // Return created project
  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return NextResponse.json(
    {
      success: true,
      data: {
        ...row!,
        description: row!.description ?? '',
        createdAt: row!.createdAt.toISOString(),
        updatedAt: row!.updatedAt.toISOString()
      },
      message: 'Created'
    },
    { status: 201 }
  );
}

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
