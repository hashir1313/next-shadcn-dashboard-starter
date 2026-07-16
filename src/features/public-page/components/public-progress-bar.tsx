type PublicProgressBarProps = {
  progress: number;
  totalTasks: number;
  completedTasks: number;
};

export default function PublicProgressBar({
  progress,
  totalTasks,
  completedTasks
}: PublicProgressBarProps) {
  return (
    <div className='mb-6'>
      <div className='mb-2 flex items-center justify-between text-sm'>
        <span className='text-muted-foreground'>Progress</span>
        <span className='font-medium'>{progress}%</span>
      </div>
      <div className='bg-primary/20 relative h-3 w-full overflow-hidden rounded-full'>
        <div className='bg-primary h-full transition-all' style={{ width: `${progress}%` }} />
      </div>
      <p className='mt-2 text-xs text-muted-foreground'>
        {completedTasks}/{totalTasks} tasks completed
      </p>
    </div>
  );
}
