'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import type { Project } from '../api/types';

type ProjectCardProps = {
  project: Project;
};

function getStatusBadge(progress: number) {
  if (progress === 100) {
    return (
      <Badge variant='default' className='bg-green-600 hover:bg-green-600'>
        Done
      </Badge>
    );
  }
  if (progress > 0) {
    return (
      <Badge
        variant='secondary'
        className='bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
      >
        In Progress
      </Badge>
    );
  }
  return (
    <Badge
      variant='secondary'
      className='bg-zinc-200 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
    >
      Not Started
    </Badge>
  );
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${project.id}`} className='h-full'>
      <Card className='flex h-full flex-col transition-colors hover:border-primary/50'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <CardTitle className='line-clamp-1 text-lg'>{project.name}</CardTitle>
            {getStatusBadge(project.progress)}
          </div>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col space-y-3'>
          {project.description && (
            <p className='line-clamp-2 text-sm text-muted-foreground'>{project.description}</p>
          )}

          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Progress</span>
              <span className='font-medium'>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className='h-2' />
            <p className='text-xs text-muted-foreground'>
              {project.completedTasks}/{project.totalTasks} tasks completed
            </p>
          </div>

          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <Icons.check className='h-3 w-3' />
            <span>
              {project.totalTasks} task{project.totalTasks !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
