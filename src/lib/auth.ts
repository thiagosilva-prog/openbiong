import { env } from '@/env.mjs';
import { db } from '@/server/db/db';
import * as schema from '@/server/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

const allowedSignupDomains = env.ALLOWED_SIGNUP_EMAIL_DOMAINS.split(',')
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendVerificationEmail: async ({
      user,
      url,
    }: { user: { email: string }; url: string; token: string }) => {
      const { sendEmail } = await import('@/server/emails');
      const VerifyEmail = (await import('@/components/emails/verify-email'))
        .default;
      await sendEmail({
        to: [user.email],
        subject: 'Verify your OpenBio email',
        react: VerifyEmail({ url }),
      });
    },
    sendResetPassword: async ({
      user,
      url,
    }: { user: { email: string }; url: string; token: string }) => {
      const { sendEmail } = await import('@/server/emails');
      const ResetPassword = (await import('@/components/emails/reset-password'))
        .default;
      await sendEmail({
        to: [user.email],
        subject: 'Reset your OpenBio password',
        react: ResetPassword({ url }),
      });
    },
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const domain = user.email.split('@')[1]?.toLowerCase();
          if (!domain || !allowedSignupDomains.includes(domain)) {
            throw new Error('Signup is restricted to company email addresses.');
          }
        },
        after: async (user) => {
          const { sendEmail } = await import('@/server/emails');
          const Welcome = (await import('@/components/emails/welcome')).default;
          await sendEmail({
            to: [user.email],
            subject: 'Welcome to OpenBio!',
            react: Welcome({ name: user.name }),
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
