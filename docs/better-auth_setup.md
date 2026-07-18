# Better Auth Setup Guide

This guide covers the setup and configuration of Better Auth features used in this project.

## Overview

Better Auth is a self-hosted authentication library with a plugin architecture. Users and sessions live in your own database — no external service dependency.

## Configuration

### Environment Variables

```env
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Server Config (`src/lib/auth.ts`)

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
});
```

### Client Config (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

## Auth Pages

Custom sign-in and sign-up pages at:
- `src/app/auth/sign-in/[[...sign-in]]/page.tsx`
- `src/app/auth/sign-up/[[...sign-up]]/page.tsx`

These use `authClient.signIn.email()` and `authClient.signIn.social('google')`.

## API Route

Auth catch-all route at `src/app/api/auth/[...all]/route.ts` handles all Better Auth endpoints.

## Server-Side Auth

### Getting the Session

```typescript
import { getSession, getUserId } from '@/lib/auth-utils';

// In server components / route handlers
const session = await getSession();
const userId = await getUserId(); // throws if not authenticated
```

### Middleware

`middleware.ts` checks for the `better-auth.session_token` cookie. Protected routes redirect to `/auth/sign-in` if no session exists.

## Database Tables

Better Auth creates these tables automatically via Drizzle push:

| Table | Purpose |
|---|---|
| `user` | User accounts (with Traqqy custom fields) |
| `session` | Active sessions |
| `account` | Auth provider accounts (email/password, Google) |
| `verification` | Email verification tokens |
| `organization` | Multi-tenant organizations (plugin) |
| `member` | Organization memberships |
| `invitation` | Organization invitations |

## Client-Side Session

```typescript
import { useSession } from '@/lib/auth-client';

function MyComponent() {
  const { data: session } = useSession();
  const user = session?.user;
  // user.id, user.email, user.name, etc.
}
```

## Sign Out

```typescript
import { authClient } from '@/lib/auth-client';

await authClient.signOut();
// Redirects to /auth/sign-in
```

## OAuth Setup (Google)

1. Create a Google Cloud project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
5. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI

## Key Files

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | Server config |
| `src/lib/auth-client.ts` | React client |
| `src/lib/auth-utils.ts` | Server-side helpers |
| `src/app/api/auth/[...all]/route.ts` | API route handler |
| `middleware.ts` | Route protection |
