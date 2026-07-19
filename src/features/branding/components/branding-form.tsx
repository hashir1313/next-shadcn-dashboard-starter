'use client';

import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Icons } from '@/components/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandingQueryOptions, updateBranding } from '../api/queries';
import type { BrandingMutationPayload } from '../api/types';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'dm-sans', label: 'DM Sans' },
  { value: 'outfit', label: 'Outfit' },
  { value: 'mullish', label: 'Mulish' },
  { value: 'geist', label: 'Geist' },
  { value: 'instrument', label: 'Instrument Sans' },
  { value: 'merriweather', label: 'Merriweather' },
  { value: 'playfair-display', label: 'Playfair Display' },
  { value: 'architects-daughter', label: 'Architects Daughter' },
  { value: 'fira-code', label: 'Fira Code' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono' },
  { value: 'space-mono', label: 'Space Mono' },
  { value: 'noto-sans-mono', label: 'Noto Sans Mono' }
];

export function SettingsBrandingForm() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: brandingData } = useQuery({
    ...brandingQueryOptions(userId || ''),
    enabled: !!userId
  });

  const branding = brandingData?.data;

  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor || '#6366f1');
  const [backgroundColor, setBackgroundColor] = useState(branding?.backgroundColor || '#ffffff');
  const [fontFamily, setFontFamily] = useState(branding?.fontFamily || 'inter');
  const [borderRadius, setBorderRadius] = useState(branding?.borderRadius || 8);
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl || '');

  useEffect(() => {
    if (branding) {
      setPrimaryColor(branding.primaryColor);
      setBackgroundColor(branding.backgroundColor);
      setFontFamily(branding.fontFamily);
      setBorderRadius(branding.borderRadius);
      setLogoUrl(branding.logoUrl || '');
    }
  }, [branding]);

  const mutation = useMutation({
    mutationFn: (data: BrandingMutationPayload) => {
      if (!userId) throw new Error('No user ID');
      return updateBranding(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      toast.success('Branding updated successfully');
    },
    onError: () => {
      toast.error('Failed to update branding');
    }
  });

  const isPro = (user as Record<string, unknown>)?.plan === 'pro';

  if (!user) return null;

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            Branding
            <Badge variant='secondary'>Pro</Badge>
          </CardTitle>
          <CardDescription>
            Customize your public page branding with custom colors, fonts, and logo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='bg-muted/50 rounded-lg p-6 text-center'>
            <Icons.pro className='text-muted-foreground mx-auto h-12 w-12' />
            <h3 className='mt-4 text-lg font-medium'>Upgrade to Pro</h3>
            <p className='text-muted-foreground mt-2 text-sm'>
              Unlock custom branding for your public pages, including colors, fonts, and logo
              upload.
            </p>
            <Button className='mt-4' onClick={() => (window.location.href = '/dashboard/billing')}>
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Branding
          <Badge variant='default'>Pro</Badge>
        </CardTitle>
        <CardDescription>
          Customize your public page branding. These settings apply to all your public project
          pages.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-6 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='primaryColor'>Primary Color</Label>
            <div className='flex gap-2'>
              <input
                id='primaryColor'
                type='color'
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className='h-10 w-14 cursor-pointer rounded border'
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder='#6366f1'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='backgroundColor'>Background Color</Label>
            <div className='flex gap-2'>
              <input
                id='backgroundColor'
                type='color'
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className='h-10 w-14 cursor-pointer rounded border'
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder='#ffffff'
              />
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='fontFamily'>Font Family</Label>
          <select
            id='fontFamily'
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-2'>
          <Label>Border Radius: {borderRadius}px</Label>
          <Slider
            value={[borderRadius]}
            onValueChange={(v) => {
              const val = Array.isArray(v) ? v[0] : v;
              setBorderRadius(val);
            }}
            max={24}
            min={0}
            step={1}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='logoUrl'>Logo URL</Label>
          <Input
            id='logoUrl'
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder='https://example.com/logo.png'
          />
          <p className='text-muted-foreground text-xs'>
            Paste a URL to your logo image. It will be displayed on your public pages.
          </p>
        </div>

        <div className='rounded-lg border p-4'>
          <Label className='text-sm font-medium'>Preview</Label>
          <div
            className='mt-3 rounded-lg p-4'
            style={{
              backgroundColor,
              borderRadius: `${borderRadius}px`,
              fontFamily: `var(--font-${fontFamily}), sans-serif`
            }}
          >
            <div className='flex items-center gap-3'>
              {logoUrl && <img src={logoUrl} alt='Logo' className='h-8 w-8 rounded object-cover' />}
              <h4 className='text-lg font-semibold' style={{ color: primaryColor }}>
                Your Project Name
              </h4>
            </div>
            <p className='text-muted-foreground mt-2 text-sm'>
              This is how your public page will look to clients.
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            mutation.mutate({
              primaryColor,
              backgroundColor,
              fontFamily,
              borderRadius,
              logoUrl: logoUrl || undefined
            })
          }
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
          Save Branding
        </Button>
      </CardContent>
    </Card>
  );
}
