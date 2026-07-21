'use client';

import { createAuthClient } from 'better-auth/react';
import { organizationClient, inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from '@/lib/auth';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [organizationClient(), inferAdditionalFields<typeof auth>()]
});

export const { signIn, signUp, signOut, useSession } = authClient;
