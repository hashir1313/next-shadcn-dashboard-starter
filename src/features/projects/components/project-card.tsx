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

function getProgressColor(progress: number): string {
  if (progress === 100) return 'text-green-600';
  if (progress >= 50) return 'text-blue-600';
  if (progress > 0) return 'text-yellow-600';
  return 'text-muted-foreground';
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${project.id}`} className='h-full'>
      <Card className='flex h-full flex-col transition-colors hover:border-primary/50'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <CardTitle className='line-clamp-1 text-lg'>{project.name}</CardTitle>
            {project.progress === 100 ? (
              <Badge variant='default' className='bg-green-600 hover:bg-green-600'>
                Done
              </Badge>
            ) : project.progress > 0 ? (
              <Badge variant='secondary'>In Progress</Badge>
            ) : (
              <Badge variant='outline'>Not Started</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col space-y-3'>
          {project.description && (
            <p className='line-clamp-2 text-sm text-muted-foreground'>{project.description}</p>
          )}

          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Progress</span>
              <span className={`font-medium ${getProgressColor(project.progress)}`}>
                {project.progress}%
              </span>
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
