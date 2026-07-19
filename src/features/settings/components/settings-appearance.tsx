'use client';

import { ThemeSelector } from '@/components/themes/theme-selector';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
        <RadioGroup value={theme || 'system'} onValueChange={setTheme} className='flex gap-4'>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='light' id='light' />
            <Label htmlFor='light' className='cursor-pointer'>
              Light
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='dark' id='dark' />
            <Label htmlFor='dark' className='cursor-pointer'>
              Dark
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='system' id='system' />
            <Label htmlFor='system' className='cursor-pointer'>
              System
            </Label>
          </div>
        </RadioGroup>
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
