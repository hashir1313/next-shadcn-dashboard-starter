'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  createTaskMutation,
  updateTaskMutation,
  updateTaskStatusMutation,
  deleteTaskMutation
} from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Task } from '../api/types';
import type { TaskStatus } from '@/constants/mock-api-projects';

type TaskListViewProps = {
  projectId: string;
  tasks: Task[];
};

const statusConfig: Record<
  TaskStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' }
};

const statusCycle: TaskStatus[] = ['pending', 'in_progress', 'completed'];

export default function TaskListView({ projectId, tasks }: TaskListViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMutation = useMutation({
    ...createTaskMutation,
    onSuccess: () => {
      toast.success('Task added');
      setNewTaskTitle('');
    },
    onError: () => toast.error('Failed to add task')
  });

  const updateMutation = useMutation({
    ...updateTaskMutation,
    onSuccess: () => {
      toast.success('Task updated');
      setEditingId(null);
    },
    onError: () => toast.error('Failed to update task')
  });

  const statusMutation = useMutation({
    ...updateTaskStatusMutation,
    onError: () => toast.error('Failed to update status')
  });

  const deleteMutation = useMutation({
    ...deleteTaskMutation,
    onSuccess: () => {
      toast.success('Task deleted');
      setDeletingId(null);
    },
    onError: () => toast.error('Failed to delete task')
  });

  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    createMutation.mutate({
      projectId,
      data: { title: newTaskTitle.trim() }
    });
  }

  function handleStatusToggle(task: Task) {
    const currentIndex = statusCycle.indexOf(task.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    statusMutation.mutate({ id: task.id, status: nextStatus });
  }

  function handleStartEdit(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  function handleSaveEdit(task: Task) {
    if (!editingTitle.trim()) return;
    updateMutation.mutate({ id: task.id, data: { title: editingTitle.trim() } });
  }

  function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate({ id: deletingId, projectId });
  }

  return (
    <div className='space-y-3'>
      {/* Add task input */}
      <div className='flex gap-2'>
        <Input
          placeholder='Add a new task...'
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTask();
            }
          }}
          className='flex-1'
        />
        <Button
          size='sm'
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim() || createMutation.isPending}
        >
          <Icons.add className='h-4 w-4' />
        </Button>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className='rounded-lg border border-dashed p-6 text-center'>
          <p className='text-sm text-muted-foreground'>
            No tasks yet. Add one above to get started.
          </p>
        </div>
      ) : (
        <div className='space-y-2'>
          {tasks.map((task) => (
            <div
              key={task.id}
              className='group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50'
            >
              {/* Status toggle */}
              <button
                onClick={() => handleStatusToggle(task)}
                className='flex h-5 w-5 shrink-0 items-center justify-center rounded border'
                title={`Status: ${statusConfig[task.status].label}`}
              >
                {task.status === 'completed' && <Icons.check className='h-3 w-3 text-green-600' />}
                {task.status === 'in_progress' && (
                  <div className='h-2 w-2 rounded-full bg-blue-600' />
                )}
              </button>

              {/* Task title */}
              <div className='flex-1 min-w-0'>
                {editingId === task.id ? (
                  <div className='flex gap-2'>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(task);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className='h-8'
                      autoFocus
                    />
                    <Button size='sm' variant='ghost' onClick={() => handleSaveEdit(task)}>
                      <Icons.check className='h-4 w-4' />
                    </Button>
                    <Button size='sm' variant='ghost' onClick={() => setEditingId(null)}>
                      <Icons.close className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <span
                    className={`block truncate ${
                      task.status === 'completed' ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {task.title}
                  </span>
                )}
              </div>

              {/* Status badge */}
              <Badge variant={statusConfig[task.status].variant} className='shrink-0'>
                {statusConfig[task.status].label}
              </Badge>

              {/* Actions */}
              {editingId !== task.id && (
                <div className='flex shrink-0 gap-1 opacity-0 group-hover:opacity-100'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => handleStartEdit(task)}
                    className='h-8 w-8 p-0'
                  >
                    <Icons.edit className='h-3 w-3' />
                  </Button>
                  <AlertDialog
                    open={deletingId === task.id}
                    onOpenChange={(open) => {
                      if (!open) setDeletingId(null);
                    }}
                  >
                    <AlertDialogTrigger
                      render={
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => setDeletingId(task.id)}
                          className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                        />
                      }
                    >
                      <Icons.trash className='h-3 w-3' />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete task?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{task.title}&quot;. This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
