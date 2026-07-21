'use client';

import { useState, useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { projectByIdOptions, tasksQueryOptions } from '../api/queries';
import { useSession } from '@/lib/auth-client';
import { notFound } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import ViewSwitcher from './view-switcher';
import TaskListView from './task-list-view';
import TaskKanbanView from './task-kanban-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import ProjectEditSheet from './project-edit-sheet';
import ProjectDeleteDialog from './project-delete-dialog';

type ProjectViewPageProps = {
  projectId: string;
};

export default function ProjectViewPage({ projectId }: ProjectViewPageProps) {
  const { data: sessionData } = useSession();
  const userId = sessionData?.user?.id;
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const { data: projectData } = useSuspenseQuery(projectByIdOptions(projectId));
  const { data: tasksData } = useSuspenseQuery(tasksQueryOptions(projectId));

  if (!projectData?.success || !projectData?.data) {
    notFound();
  }

  const project = projectData.data;
  const tasks = tasksData || [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
            <div className='flex items-start justify-between'>
              <div>
                <h1 className='text-2xl font-bold'>{project.name}</h1>
                {project.description && (
                  <p className='mt-1 text-muted-foreground'>{project.description}</p>
                )}
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                  onClick={() => setEditOpen(true)}
                >
                  <Icons.edit className='h-4 w-4' />
                  <span className='sr-only'>Edit project</span>
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
                  onClick={() => setDeleteOpen(true)}
                >
                  <Icons.trash className='h-4 w-4' />
                  <span className='sr-only'>Delete project</span>
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Progress</span>
                <span className='font-medium'>{progress}%</span>
              </div>
              <Progress value={progress} className='h-2' />
              <p className='text-xs text-muted-foreground'>
                {completedTasks}/{totalTasks} tasks completed
              </p>
            </div>

            {/* Public URL */}
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm'>
                <Icons.externalLink className='h-4 w-4 text-muted-foreground' />
                <span className='text-muted-foreground'>
                  {origin}
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

      <ProjectEditSheet project={project} open={editOpen} onOpenChange={setEditOpen} />
      <ProjectDeleteDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
