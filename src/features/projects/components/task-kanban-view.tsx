'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTaskStatusMutation } from '../api/mutations';
import { projectKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import type { Task } from '../api/types';
import type { TaskStatus } from '@/constants/mock-api-projects';

type TaskKanbanViewProps = {
  projectId: string;
  tasks: Task[];
};

type KanbanColumn = {
  id: TaskStatus;
  title: string;
  icon: keyof typeof Icons;
  color: string;
};

const columns: KanbanColumn[] = [
  { id: 'pending', title: 'Pending', icon: 'clock', color: 'text-yellow-600' },
  { id: 'in_progress', title: 'In Progress', icon: 'spinner', color: 'text-blue-600' },
  { id: 'completed', title: 'Completed', icon: 'check', color: 'text-green-600' }
];

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className='cursor-grab rounded-md border bg-card p-3 shadow-sm transition-colors hover:border-primary/50 active:cursor-grabbing'>
        <p className='text-sm font-medium'>{task.title}</p>
        {task.description && (
          <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>{task.description}</p>
        )}
      </div>
    </div>
  );
}

export default function TaskKanbanView({ projectId, tasks }: TaskKanbanViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const statusMutation = useMutation({
    ...updateTaskStatusMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: () => toast.error('Failed to move task')
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Only update if the status actually changed
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      statusMutation.mutate({ id: taskId, status: newStatus });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className='grid gap-4 md:grid-cols-3'>
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          const Icon = Icons[column.icon];

          return (
            <DndContext
              key={column.id}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Card key={column.id}>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                      <Icon className={`h-4 w-4 ${column.color}`} />
                      {column.title}
                    </CardTitle>
                    <Badge variant='secondary' className='text-xs'>
                      {columnTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <SortableContext
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className='min-h-[200px] space-y-2'>
                      {columnTasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className='flex h-[200px] items-center justify-center rounded-lg border border-dashed'>
                          <p className='text-xs text-muted-foreground'>Drop tasks here</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            </DndContext>
          );
        })}
      </div>
    </DndContext>
  );
}
