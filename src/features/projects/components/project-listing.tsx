'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { projectsQueryOptions } from '../api/queries';
import ProjectCard from './project-card';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProjectListingProps = {
  userId: string;
};

export default function ProjectListing({ userId }: ProjectListingProps) {
  const { data } = useSuspenseQuery(projectsQueryOptions({ userId, page: 1, limit: 50 }));

  const projects = data?.data || [];

  if (projects.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
        <Icons.dashboard className='mb-4 h-12 w-12 text-muted-foreground/50' />
        <h3 className='mb-2 text-lg font-semibold'>No projects yet</h3>
        <p className='mb-4 text-sm text-muted-foreground'>
          Create your first project to start tracking progress.
        </p>
        <Link href='/dashboard/projects/new' className={cn(buttonVariants(), 'text-xs md:text-sm')}>
          <Icons.add className='mr-2 h-4 w-4' /> Create Project
        </Link>
      </div>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
