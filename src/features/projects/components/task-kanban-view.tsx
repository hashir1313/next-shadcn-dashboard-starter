'use client';

import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { updateTaskStatusMutation, reorderTasksMutation } from '../api/mutations';
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
    data: { type: 'task', status: task.status }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
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

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className='rounded-md border bg-card p-3 shadow-lg ring-2 ring-primary/20'>
      <p className='text-sm font-medium'>{task.title}</p>
      {task.description && (
        <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>{task.description}</p>
      )}
    </div>
  );
}

function KanbanColumn({ column, tasks: columnTasks }: { column: KanbanColumn; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', status: column.id }
  });

  const Icon = Icons[column.icon];

  return (
    <Card className={isOver ? 'ring-2 ring-primary/30' : ''}>
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
        <div ref={setNodeRef} className='min-h-[200px] space-y-2'>
          <SortableContext
            items={columnTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {columnTasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </SortableContext>
          {columnTasks.length === 0 && (
            <div className='flex h-[200px] items-center justify-center rounded-lg border border-dashed'>
              <p className='text-xs text-muted-foreground'>Drop tasks here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskKanbanView({ projectId, tasks }: TaskKanbanViewProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const pendingRef = useRef(false);

  // Only sync from parent when no optimistic updates are pending
  if (!pendingRef.current && tasks !== localTasks && tasks.length > 0) {
    setLocalTasks(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const statusMutation = useMutation({
    ...updateTaskStatusMutation,
    onSuccess: () => {
      pendingRef.current = false;
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: () => {
      pendingRef.current = false;
      setLocalTasks(tasks);
      toast.error('Failed to move task');
    }
  });

  const reorderMutation = useMutation({
    ...reorderTasksMutation,
    onSuccess: () => {
      pendingRef.current = false;
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: () => {
      pendingRef.current = false;
      setLocalTasks(tasks);
      toast.error('Failed to reorder tasks');
    }
  });

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = localTasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine the target column status
    let targetStatus: TaskStatus | null = null;

    // Dropped on a column
    const column = columns.find((c) => c.id === overId);
    if (column) {
      targetStatus = column.id;
    } else {
      // Dropped on a task — find which column that task is in
      const overTask = localTasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (!targetStatus || activeTask.status === targetStatus) return;

    // Optimistic local update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus! } : t))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropped on a column directly
    const column = columns.find((c) => c.id === overId);
    if (column) {
      if (activeTask.status !== column.id) {
        pendingRef.current = true;
        statusMutation.mutate({ id: activeId, status: column.id });
      }
      return;
    }

    // Dropped on another task
    const overTask = localTasks.find((t) => t.id === overId);
    if (!overTask) return;

    // Same column — reorder
    if (activeTask.status === overTask.status) {
      const columnTasks = localTasks.filter((t) => t.status === activeTask.status);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        const otherTasks = localTasks.filter((t) => t.status !== activeTask.status);
        setLocalTasks([...otherTasks, ...reordered]);

        const taskIds = [...otherTasks.map((t) => t.id), ...reordered.map((t) => t.id)];
        pendingRef.current = true;
        reorderMutation.mutate({ projectId, taskIds });
      }
    } else {
      // Different column — move task
      if (activeTask.status !== overTask.status) {
        pendingRef.current = true;
        statusMutation.mutate({ id: activeId, status: overTask.status });
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='grid gap-4 md:grid-cols-3'>
        {columns.map((column) => {
          const columnTasks = localTasks.filter((t) => t.status === column.id);
          return <KanbanColumn key={column.id} column={column} tasks={columnTasks} />;
        })}
      </div>
      <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}
