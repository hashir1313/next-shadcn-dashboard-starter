import { db } from '@/lib/db';
import { user, projects, tasks, brandingConfigs } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export type PublicPageData = {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string;
    totalTasks: number;
    completedTasks: number;
    progress: number;
    createdAt: string;
    updatedAt: string;
  };
  tasks: {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    position: number;
  }[];
  freelancer: {
    displayName: string;
    publicEmail: string | null;
    logoUrl: string | null;
  };
  branding: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: number;
    logoUrl: string | null;
  } | null;
};

export async function getPublicPageData(userId: string, slug: string): Promise<PublicPageData> {
  const [userRow] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

  if (!userRow) notFound();

  const publicEmail = userRow.publicEmail || userRow.email;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userRow.id), eq(projects.slug, slug)))
    .limit(1);

  if (!project) notFound();

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id))
    .orderBy(asc(tasks.position));

  let branding: PublicPageData['branding'] = null;
  if (userRow.plan === 'pro') {
    const [brandingRow] = await db
      .select()
      .from(brandingConfigs)
      .where(eq(brandingConfigs.userId, userRow.id))
      .limit(1);

    if (brandingRow) {
      branding = {
        primaryColor: brandingRow.primaryColor,
        backgroundColor: brandingRow.backgroundColor,
        fontFamily: brandingRow.fontFamily,
        borderRadius: brandingRow.borderRadius,
        logoUrl: brandingRow.logoUrl
      };
    }
  }

  return {
    project: {
      ...project,
      description: project.description ?? '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    },
    tasks: taskRows.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? '',
      status: t.status as 'pending' | 'in_progress' | 'completed',
      position: t.position
    })),
    freelancer: {
      displayName: userRow.name,
      publicEmail,
      logoUrl: userRow.logoUrl
    },
    branding
  };
}
