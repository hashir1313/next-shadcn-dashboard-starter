import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsAccountForm } from '@/features/settings/components/settings-account-form';
import { SettingsAppearance } from '@/features/settings/components/settings-appearance';
import { SettingsBrandingForm } from '@/features/branding/components/branding-form';

export const metadata = {
  title: 'Settings'
};

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle='Settings'
      pageDescription='Manage your account settings and preferences.'
    >
      <Tabs defaultValue='account' className='w-full'>
        <TabsList className='w-full justify-start'>
          <TabsTrigger value='account'>Account</TabsTrigger>
          <TabsTrigger value='appearance'>Appearance</TabsTrigger>
          <TabsTrigger value='branding'>Branding</TabsTrigger>
        </TabsList>

        <TabsContent value='account' className='mt-6 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Update your account information and manage your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsAccountForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='mt-6 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsAppearance />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='branding' className='mt-6 space-y-6'>
          <SettingsBrandingForm />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
