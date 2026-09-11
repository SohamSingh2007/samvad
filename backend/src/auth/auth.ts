import { betterAuth } from 'better-auth';
import { dash } from '@better-auth/infra';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../db/schema.js';
import * as dotenv from 'dotenv';
dotenv.config({ override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

export const auth = betterAuth({
  baseURL: {
    allowedHosts: ['localhost:4000', '127.0.0.1:4000', 'samvad-api.qixolabs.com'],
    fallback: process.env.BETTER_AUTH_URL || 'https://samvad-api.qixolabs.com',
  },
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
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  account: {
    skipStateCookieCheck: true,
  },
  user: {
    additionalFields: {
      accessibilityPreferences: {
        type: 'string',
        required: false,
      },
    },
  },
  plugins: [
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
  ],
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://samvad.qixolabs.com',
    'https://samvad-api.qixolabs.com',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain:
        process.env.COOKIE_DOMAIN ||
        (process.env.BETTER_AUTH_URL?.includes('qixolabs.com') ? '.qixolabs.com' : undefined),
    },
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.BETTER_AUTH_URL?.startsWith('https'),
    },
  },
});
