import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
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
          // Block sign-up if email belongs to a deleted/suspended account
          if (userData.email) {
            const [existing] = await db
              .select({ id: user.id, status: user.status })
              .from(user)
              .where(eq(user.email, userData.email))
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
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith('/sign-in/') && ctx.context.newSession?.user) {
        const userId = ctx.context.newSession.user.id;
        const [foundUser] = await db
          .select({ status: user.status })
          .from(user)
          .where(eq(user.id, userId))
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
