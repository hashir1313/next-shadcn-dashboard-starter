import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import ProjectForm from '@/features/projects/components/project-form';

export const metadata = {
  title: 'Dashboard: New Project'
};

export default async function NewProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  return (
    <PageContainer pageTitle='New Project' pageDescription='Create a new project.'>
      <ProjectForm />
    </PageContainer>
  );
}
