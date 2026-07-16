import type { PublicPageData } from '../api/service';
import PublicTaskList from './public-task-list';
import PublicProgressBar from './public-progress-bar';

type PublicProjectViewProps = {
  data: PublicPageData;
};

function getBrandingStyles(branding: PublicPageData['branding']) {
  if (!branding) return {};
  return {
    '--public-primary': branding.primaryColor,
    '--public-bg': branding.backgroundColor,
    '--public-radius': `${branding.borderRadius}px`,
    fontFamily: `var(--font-${branding.fontFamily}), sans-serif`
  } as React.CSSProperties;
}

function getStatusCounts(tasks: PublicPageData['tasks']) {
  return {
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length
  };
}

export default function PublicProjectView({ data }: PublicProjectViewProps) {
  const { project, tasks, freelancer, branding } = data;
  const counts = getStatusCounts(tasks);
  const brandingStyles = getBrandingStyles(branding);

  return (
    <div className='bg-background min-h-screen' style={brandingStyles}>
      <div className='mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8'>
        {/* Freelancer info */}
        <div className='mb-8 flex items-center gap-3'>
          {freelancer.logoUrl && (
            <img
              src={freelancer.logoUrl}
              alt={freelancer.displayName}
              className='h-10 w-10 rounded-full object-cover'
            />
          )}
          <div>
            <p className='text-sm font-medium'>{freelancer.displayName}</p>
            {freelancer.publicEmail && (
              <p className='text-xs text-muted-foreground'>{freelancer.publicEmail}</p>
            )}
          </div>
        </div>

        {/* Project header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>{project.name}</h1>
          {project.description && (
            <p className='mt-2 text-muted-foreground'>{project.description}</p>
          )}
        </div>

        {/* Progress */}
        <PublicProgressBar
          progress={project.progress}
          totalTasks={project.totalTasks}
          completedTasks={project.completedTasks}
        />

        {/* Status summary */}
        <div className='mb-8 flex gap-4 text-sm'>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block h-2.5 w-2.5 rounded-full bg-yellow-500' />
            <span className='text-muted-foreground'>{counts.pending} pending</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block h-2.5 w-2.5 rounded-full bg-blue-500' />
            <span className='text-muted-foreground'>{counts.inProgress} in progress</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block h-2.5 w-2.5 rounded-full bg-green-500' />
            <span className='text-muted-foreground'>{counts.completed} completed</span>
          </div>
        </div>

        {/* Task list */}
        <PublicTaskList tasks={tasks} />

        {/* Footer */}
        <div className='mt-12 border-t pt-6 text-center text-xs text-muted-foreground'>
          Powered by Traqqy
        </div>
      </div>
    </div>
  );
}
