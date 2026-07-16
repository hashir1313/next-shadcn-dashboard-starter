import type { PublicPageData } from '../api/service';

type PublicTaskListProps = {
  tasks: PublicPageData['tasks'];
};

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }
} as const;

export default function PublicTaskList({ tasks }: PublicTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className='rounded-lg border p-8 text-center text-muted-foreground'>No tasks yet.</div>
    );
  }

  return (
    <div className='space-y-2'>
      {tasks.map((task) => {
        const config = statusConfig[task.status];
        return (
          <div
            key={task.id}
            className='flex items-start justify-between gap-3 rounded-lg border p-4'
          >
            <div className='min-w-0 flex-1'>
              <p
                className={
                  task.status === 'completed' ? 'text-muted-foreground line-through' : 'font-medium'
                }
              >
                {task.title}
              </p>
              {task.description && (
                <p className='mt-1 text-sm text-muted-foreground'>{task.description}</p>
              )}
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
            >
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
