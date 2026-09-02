import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async (data: { user: { email: string }, url: string }) => {
      // Fire and forget
      sendResetPasswordEmail(data.user.email, data.url).catch(console.error);
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async (data: { user: { email: string }, url: string }) => {
      // Fire and forget
      sendVerificationEmail(data.user.email, data.url).catch(console.error);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "general_user",
        input: true,
      },
    },
  },
});
