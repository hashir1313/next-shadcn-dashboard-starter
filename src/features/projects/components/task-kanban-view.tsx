'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay
} from '@/components/ui/kanban';
import { updateTaskStatusMutation, reorderTasksMutation } from '../api/mutations';
import { projectKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task } from '../api/types';
import type { TaskStatus } from '@/constants/mock-api-projects';
import { createRestrictToContainer } from '@/features/kanban/utils/restrict-to-container';

type TaskKanbanViewProps = {
  projectId: string;
  tasks: Task[];
};

const COLUMN_MAP: Record<string, TaskStatus> = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed'
};

const COLUMN_TITLES: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed'
};

const COLUMN_ICONS: Record<string, keyof typeof Icons> = {
  pending: 'clock',
  in_progress: 'spinner',
  completed: 'check'
};

const COLUMN_COLORS: Record<string, string> = {
  pending: 'text-yellow-600',
  in_progress: 'text-blue-600',
  completed: 'text-green-600'
};

function tasksToColumns(tasks: Task[]): Record<UniqueIdentifier, Task[]> {
  const columns: Record<UniqueIdentifier, Task[]> = {
    pending: [],
    in_progress: [],
    completed: []
  };
  for (const task of tasks) {
    const col = columns[task.status];
    if (col) col.push(task);
  }
  return columns;
}

function TaskCardContent({ task }: { task: Task }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='line-clamp-1 text-sm font-medium'>{task.title}</span>
      {task.description && (
        <span className='line-clamp-2 text-xs text-muted-foreground'>{task.description}</span>
      )}
    </div>
  );
}

function TaskColumn({ value, tasks: columnTasks }: { value: string; tasks: Task[] }) {
  const Icon = Icons[COLUMN_ICONS[value] ?? 'check'];
  const color = COLUMN_COLORS[value] ?? '';

  return (
    <KanbanColumn value={value} className='w-full shrink-0 md:w-[300px]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Icon className={`h-4 w-4 ${color}`} />
          <span className='text-sm font-semibold'>{COLUMN_TITLES[value] ?? value}</span>
          <Badge variant='secondary' className='pointer-events-none rounded-sm'>
            {columnTasks.length}
          </Badge>
        </div>
      </div>
      <div className='flex flex-col gap-2 p-0.5'>
        {columnTasks.map((task) => (
          <KanbanItem key={task.id} value={task.id} asHandle>
            <div className='rounded-md border bg-card p-3 shadow-xs'>
              <TaskCardContent task={task} />
            </div>
          </KanbanItem>
        ))}
        {columnTasks.length === 0 && (
          <div className='flex h-[100px] items-center justify-center rounded-lg border border-dashed'>
            <p className='text-xs text-muted-foreground'>Drop tasks here</p>
          </div>
        )}
      </div>
    </KanbanColumn>
  );
}

export default function TaskKanbanView({ projectId, tasks }: TaskKanbanViewProps) {
  const [columns, setColumns] = useState<Record<UniqueIdentifier, Task[]>>(() =>
    tasksToColumns(tasks)
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef(columns);
  const lastColumnsRef = useRef<Record<UniqueIdentifier, Task[]>>(columns);
  const dragStartColumnsRef = useRef<Record<UniqueIdentifier, Task[]> | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );

  const statusMutation = useMutation({
    ...updateTaskStatusMutation,
    onSettled: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
    }
  });

  const reorderMutation = useMutation({
    ...reorderTasksMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: () => {
      setColumns(lastColumnsRef.current);
      toast.error('Failed to reorder tasks');
    }
  });

  const handleValueChange = useCallback((newColumns: Record<UniqueIdentifier, Task[]>) => {
    lastColumnsRef.current = columnsRef.current;
    columnsRef.current = newColumns;
    setColumns(newColumns);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    // Snapshot columns at drag start for diffing on drag end
    dragStartColumnsRef.current = columnsRef.current;
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const beforeColumns = dragStartColumnsRef.current;
      dragStartColumnsRef.current = null;

      if (!over || !beforeColumns) return;

      const activeId = active.id as string;
      const afterColumns = columnsRef.current;

      // Find which column the task was in BEFORE the drag
      let fromColumn: string | null = null;
      for (const [colKey, colTasks] of Object.entries(beforeColumns)) {
        if (colTasks.some((t) => t.id === activeId)) {
          fromColumn = colKey;
          break;
        }
      }

      // Find which column the task is in AFTER the drag
      let toColumn: string | null = null;
      for (const [colKey, colTasks] of Object.entries(afterColumns)) {
        if (colTasks.some((t) => t.id === activeId)) {
          toColumn = colKey;
          break;
        }
      }

      if (!fromColumn || !toColumn) return;

      // Cross-column move → fire status mutation
      if (fromColumn !== toColumn) {
        const newStatus = COLUMN_MAP[toColumn];
        if (newStatus) {
          statusMutation.mutate({ id: activeId, status: newStatus });
        }
        return;
      }

      // Same column → check if order changed → fire reorder mutation
      const beforeIds = beforeColumns[fromColumn]?.map((t) => t.id) ?? [];
      const afterIds = afterColumns[toColumn]?.map((t) => t.id) ?? [];
      const orderChanged =
        beforeIds.length === afterIds.length && beforeIds.some((id, i) => id !== afterIds[i]);

      if (orderChanged) {
        reorderMutation.mutate({ projectId, taskIds: afterIds });
      }
    },
    [projectId, statusMutation, reorderMutation]
  );

  return (
    <div ref={containerRef}>
      <Kanban
        value={columns}
        onValueChange={handleValueChange}
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className='w-full overflow-x-auto rounded-md pb-4'>
          <KanbanBoard className='flex flex-col items-start gap-4 md:flex-row'>
            {Object.entries(columns).map(([columnValue, columnTasks]) => (
              <TaskColumn key={columnValue} value={columnValue} tasks={columnTasks} />
            ))}
          </KanbanBoard>
        </div>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const colTasks = (columns[value] ?? []) as Task[];
              return <TaskColumn value={value as string} tasks={colTasks} />;
            }

            const task = Object.values(columns)
              .flat()
              .find((t) => t.id === value);

            if (!task) return null;
            return (
              <div className='rounded-md border bg-card p-3 shadow-lg ring-2 ring-primary/20'>
                <TaskCardContent task={task} />
              </div>
            );
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
