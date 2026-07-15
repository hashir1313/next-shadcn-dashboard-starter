import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { projectsQueryOptions } from '@/features/projects/api/queries';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import ProjectListing from '@/features/projects/components/project-listing';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard: Projects'
};

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(projectsQueryOptions({ userId, page: 1, limit: 50 }));

  return (
    <PageContainer
      pageTitle='Projects'
      pageDescription='Manage your projects and track progress.'
      pageHeaderAction={
        <Link href='/dashboard/projects/new' className={cn(buttonVariants(), 'text-xs md:text-sm')}>
          <Icons.add className='mr-2 h-4 w-4' /> New Project
        </Link>
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectListing userId={userId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
