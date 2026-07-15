'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  createTaskMutation,
  updateTaskMutation,
  updateTaskStatusMutation,
  deleteTaskMutation
} from '../api/mutations';
import { projectKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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

const allStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];

export default function TaskListView({ projectId, tasks }: TaskListViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMutation = useMutation({
    ...createTaskMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Task added');
      setNewTaskTitle('');
    },
    onError: () => toast.error('Failed to add task')
  });

  const updateMutation = useMutation({
    ...updateTaskMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Task updated');
      setEditingId(null);
    },
    onError: () => toast.error('Failed to update task')
  });

  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRef = useRef<Map<string, Task[] | undefined>>(new Map());

  const statusMutation = useMutation({
    ...updateTaskStatusMutation,
    onMutate: async (vars) => {
      const original = pendingRef.current.get(vars.id);
      return { previousTasks: original };
    },
    onError: (_err, vars, context) => {
      const ctx = context as { previousTasks?: Task[] } | undefined;
      if (ctx?.previousTasks) {
        getQueryClient().setQueryData(projectKeys.tasks(projectId), ctx.previousTasks);
      }
      debounceRef.current.delete(vars.id);
      pendingRef.current.delete(vars.id);
      toast.error('Failed to update status');
    },
    onSettled: (_data, _err, vars) => {
      debounceRef.current.delete(vars.id);
      pendingRef.current.delete(vars.id);
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
    }
  });

  const deleteMutation = useMutation({
    ...deleteTaskMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
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

  const handleStatusChange = useCallback(
    (task: Task, newStatus: TaskStatus) => {
      if (task.status === newStatus) return;

      const existing = debounceRef.current.get(task.id);
      if (existing) clearTimeout(existing);

      if (!pendingRef.current.has(task.id)) {
        const currentTasks = getQueryClient().getQueryData<Task[]>(projectKeys.tasks(projectId));
        pendingRef.current.set(task.id, currentTasks);
      }

      const currentTasks = getQueryClient().getQueryData<Task[]>(projectKeys.tasks(projectId));
      if (currentTasks) {
        const newTasks = currentTasks.map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        );
        getQueryClient().setQueryData<Task[]>(projectKeys.tasks(projectId), newTasks);
      }

      const timer = setTimeout(() => {
        statusMutation.mutate({ id: task.id, status: newStatus });
      }, 300);

      debounceRef.current.set(task.id, timer);
    },
    [projectId, statusMutation]
  );

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

              {/* Status dropdown */}
              {editingId !== task.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<button className='cursor-pointer outline-none' />}>
                    <Badge
                      variant={statusConfig[task.status].variant}
                      className='shrink-0 cursor-pointer transition-colors hover:opacity-80'
                    >
                      {statusConfig[task.status].label}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {allStatuses.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(task, status)}
                        className='gap-2'
                      >
                        <Badge
                          variant={statusConfig[status].variant}
                          className='pointer-events-none text-xs'
                        >
                          {statusConfig[status].label}
                        </Badge>
                        {task.status === status && <Icons.check className='h-3 w-3 ml-auto' />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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
                          className='h-8 w-8 p-0 text-red-500 hover:text-red-600'
                        />
                      }
                    >
                      <Icons.trash className='h-3 w-3 text-red-500' />
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
