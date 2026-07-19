import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { createAuthMiddleware } from 'better-auth/api';
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
        after: async (userData) => {
          await db
            .update(user)
            .set({ status: 'active', plan: 'free' })
            .where(eq(user.id, userData.id));
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
          throw new Error('Account is not available');
        }
      }
    })
  }
});
