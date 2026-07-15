'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ProgressBarProps = {
  progress: number;
  totalTasks: number;
  completedTasks: number;
  className?: string;
};

export default function ProgressBar({
  progress,
  totalTasks,
  completedTasks,
  className
}: ProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-muted-foreground'>Progress</span>
        <span className='text-sm font-medium'>
          {completedTasks}/{totalTasks} tasks completed
        </span>
      </div>
      <div className='flex items-center gap-3'>
        <Progress value={progress} className='h-2 flex-1 [&>div]:bg-green-600' />
        <span className='text-sm font-semibold tabular-nums'>{progress}%</span>
      </div>
    </div>
  );
}
