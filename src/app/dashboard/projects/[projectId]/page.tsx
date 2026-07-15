import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { projectByIdOptions, tasksQueryOptions } from '@/features/projects/api/queries';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import ProjectViewPage from '@/features/projects/components/project-view-page';

export const metadata = {
  title: 'Dashboard: Project'
};

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailPage(props: PageProps) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(projectByIdOptions(params.projectId));
  void queryClient.prefetchQuery(tasksQueryOptions(params.projectId));

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectViewPage projectId={params.projectId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
