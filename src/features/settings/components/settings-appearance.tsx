'use client';

import { ThemeSelector } from '@/components/themes/theme-selector';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const MODE_OPTIONS = [
  { value: 'light', label: 'Light', icon: Icons.brightness },
  { value: 'dark', label: 'Dark', icon: Icons.moon },
  { value: 'system', label: 'System', icon: Icons.laptop }
] as const;

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <div>
          <Label className='text-base'>Dashboard Theme</Label>
          <p className='text-muted-foreground text-sm'>Choose a color theme for your dashboard.</p>
        </div>
        <ThemeSelector />
      </div>

      <div className='space-y-4'>
        <div>
          <Label className='text-base'>Mode</Label>
          <p className='text-muted-foreground text-sm'>Select light, dark, or system mode.</p>
        </div>
        <div className='flex gap-2'>
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = (theme || 'system') === opt.value;
            return (
              <Button
                key={opt.value}
                variant={isActive ? 'default' : 'outline'}
                size='sm'
                onClick={() => setTheme(opt.value)}
                className={cn('gap-2', isActive && 'ring-2 ring-primary/20')}
              >
                <Icon className='h-4 w-4' />
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className='space-y-4'>
        <div>
          <Label className='text-base'>Quick Toggle</Label>
          <p className='text-muted-foreground text-sm'>
            Toggle between light and dark mode instantly.
          </p>
        </div>
        <ThemeModeToggle />
      </div>
    </div>
  );
}
