import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendResetPasswordEmail } from "./email";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Collect all trusted origins — covers production, branch previews, and unique deploy URLs
const buildTrustedOrigins = () => {
  const origins = new Set<string>([baseUrl, "http://localhost:3000"]);
  if (process.env.NEXT_PUBLIC_APP_URL) origins.add(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) origins.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return Array.from(origins);
};

export const auth = betterAuth({
  baseURL: baseUrl,
  trustedOrigins: buildTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword(data) {
      try {
        await sendResetPasswordEmail(data.user.email, data.url);
      } catch (error) {
        console.error("Error sending reset password email:", error);
      }
    },
  },
  session: {
    additionalFields: {
      // input: false = users can never set these themselves (sign-up or update-user).
      // Only server code (lib/db) may change role, organisation or branch.
      role: { type: "string", defaultValue: "CASHIER", input: false },
      organisationId: { type: "string", required: false, defaultValue: "", input: false },
      branchId: { type: "string", required: false, defaultValue: "", input: false },
    },
  },
  user: {
    additionalFields: {
      // input: false = users can never set these themselves (sign-up or update-user).
      // Only server code (lib/db) may change role, organisation or branch.
      role: { type: "string", defaultValue: "CASHIER", input: false },
      organisationId: { type: "string", required: false, defaultValue: "", input: false },
      branchId: { type: "string", required: false, defaultValue: "", input: false },
    },
  },
});
