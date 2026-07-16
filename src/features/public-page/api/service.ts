import { db } from '@/lib/db';
import { users, projects, tasks, brandingConfigs } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { clerkClient } from '@clerk/nextjs/server';

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
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) notFound();

  // Runtime fallback: resolve email from Clerk if DB has NULL publicEmail
  let publicEmail = user.publicEmail;
  if (!publicEmail) {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      publicEmail =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ?? null;
    } catch {
      // Clerk API unavailable — proceed without email
    }
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, user.id), eq(projects.slug, slug)))
    .limit(1);

  if (!project) notFound();

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id))
    .orderBy(asc(tasks.position));

  let branding: PublicPageData['branding'] = null;
  if (user.plan === 'pro') {
    const [brandingRow] = await db
      .select()
      .from(brandingConfigs)
      .where(eq(brandingConfigs.userId, user.id))
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
      displayName: user.displayName,
      publicEmail,
      logoUrl: user.logoUrl
    },
    branding
  };
}
