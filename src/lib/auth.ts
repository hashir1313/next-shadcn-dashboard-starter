import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { customSession } from 'better-auth/plugins';
import { db } from '@/lib/db';
import { user as userTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-change-me',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // 1 day
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          if (userData.email) {
            const [existing] = await db
              .select({ id: userTable.id, status: userTable.status })
              .from(userTable)
              .where(eq(userTable.email, userData.email))
              .limit(1);

            if (existing && (existing.status === 'deleted' || existing.status === 'suspended')) {
              throw new APIError('FORBIDDEN', {
                message: 'This email is not available'
              });
            }
          }
          return { data: userData };
        }
      }
    }
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const [dbUser] = await db
        .select({
          plan: userTable.plan,
          status: userTable.status,
          username: userTable.username,
          dashboardTheme: userTable.dashboardTheme,
          dashboardMode: userTable.dashboardMode,
          publicEmail: userTable.publicEmail,
          logoUrl: userTable.logoUrl
        })
        .from(userTable)
        .where(eq(userTable.id, user.id))
        .limit(1);

      return {
        user: {
          ...user,
          plan: dbUser?.plan ?? 'free',
          status: dbUser?.status ?? 'active',
          username: dbUser?.username ?? null,
          dashboardTheme: dbUser?.dashboardTheme ?? 'vercel',
          dashboardMode: dbUser?.dashboardMode ?? 'system',
          publicEmail: dbUser?.publicEmail ?? null,
          logoUrl: dbUser?.logoUrl ?? null
        },
        session
      };
    })
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith('/sign-in/') && ctx.context.newSession?.user) {
        const userId = ctx.context.newSession.user.id;
        const [foundUser] = await db
          .select({ status: userTable.status })
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);

        if (foundUser && (foundUser.status === 'deleted' || foundUser.status === 'suspended')) {
          throw new APIError('FORBIDDEN', {
            message: 'Account is not available'
          });
        }
      }
    })
  }
});
