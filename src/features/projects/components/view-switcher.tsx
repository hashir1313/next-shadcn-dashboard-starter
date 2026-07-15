'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

type ViewMode = 'list' | 'kanban';

type ViewSwitcherProps = {
  defaultView?: ViewMode;
  onChange?: (view: ViewMode) => void;
};

export default function ViewSwitcher({ defaultView = 'list', onChange }: ViewSwitcherProps) {
  const [view, setView] = useState<ViewMode>(defaultView);

  function handleSwitch(newView: ViewMode) {
    setView(newView);
    onChange?.(newView);
  }

  return (
    <div className='flex items-center gap-1 rounded-md border p-1'>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => handleSwitch('list')}
        className='h-8 px-3'
      >
        <Icons.page className='mr-1 h-4 w-4' />
        List
      </Button>
      <Button
        variant={view === 'kanban' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => handleSwitch('kanban')}
        className='h-8 px-3'
      >
        <Icons.kanban className='mr-1 h-4 w-4' />
        Kanban
      </Button>
    </div>
  );
}
