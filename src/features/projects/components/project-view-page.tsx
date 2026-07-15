'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { projectByIdOptions, tasksQueryOptions } from '../api/queries';
import { useAuth } from '@clerk/nextjs';
import { notFound } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import ViewSwitcher from './view-switcher';
import TaskListView from './task-list-view';
import TaskKanbanView from './task-kanban-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

type ProjectViewPageProps = {
  projectId: string;
};

export default function ProjectViewPage({ projectId }: ProjectViewPageProps) {
  const { userId } = useAuth();
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [copied, setCopied] = useState(false);

  const { data: projectData } = useSuspenseQuery(projectByIdOptions(projectId));
  const { data: tasksData } = useSuspenseQuery(tasksQueryOptions(projectId));

  if (!projectData?.success || !projectData?.data) {
    notFound();
  }

  const project = projectData.data;
  const tasks = tasksData || [];

  const publicUrl = userId ? `/${userId}/${project.slug}` : '';

  function handleCopyUrl() {
    const fullUrl = `${window.location.origin}${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Public URL copied to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='space-y-6'>
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className='space-y-4'>
            <div>
              <h1 className='text-2xl font-bold'>{project.name}</h1>
              {project.description && (
                <p className='mt-1 text-muted-foreground'>{project.description}</p>
              )}
            </div>

            {/* Progress */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Progress</span>
                <span className='text-sm font-medium'>
                  {project.completedTasks}/{project.totalTasks} tasks completed
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <Progress value={project.progress} className='h-2 flex-1 [&>div]:bg-green-600' />
                <span className='text-sm font-semibold tabular-nums'>{project.progress}%</span>
              </div>
            </div>

            {/* Public URL */}
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm'>
                <Icons.externalLink className='h-4 w-4 text-muted-foreground' />
                <span className='text-muted-foreground'>
                  {typeof window !== 'undefined' ? window.location.origin : ''}
                  {publicUrl}
                </span>
              </div>
              <Button size='sm' variant='outline' onClick={handleCopyUrl}>
                {copied ? (
                  <Icons.check className='mr-1 h-3 w-3 text-green-600' />
                ) : (
                  <Icons.clipboard className='mr-1 h-3 w-3' />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <a href={publicUrl} target='_blank' rel='noopener noreferrer'>
                <Button size='sm' variant='ghost'>
                  <Icons.externalLink className='mr-1 h-3 w-3' />
                  Preview
                </Button>
              </a>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* View Switcher + Tasks */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Tasks</h2>
          <ViewSwitcher defaultView='list' onChange={setView} />
        </div>

        {view === 'list' ? (
          <TaskListView projectId={projectId} tasks={tasks} />
        ) : (
          <TaskKanbanView projectId={projectId} tasks={tasks} />
        )}
      </div>
    </div>
  );
}
