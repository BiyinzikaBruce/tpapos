import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendResetPasswordEmail } from "./email";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: baseUrl,
  trustedOrigins: [
    baseUrl,
    "https://tpa-pos.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ],
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
      role: { type: "string", defaultValue: "CASHIER" },
      organisationId: { type: "string", required: false, defaultValue: "" },
      branchId: { type: "string", required: false, defaultValue: "" },
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "CASHIER" },
      organisationId: { type: "string", required: false, defaultValue: "" },
      branchId: { type: "string", required: false, defaultValue: "" },
    },
  },
});
