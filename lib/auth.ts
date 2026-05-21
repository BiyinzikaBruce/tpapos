import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendResetPasswordEmail } from "./email";

export const auth = betterAuth({
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
      role: { type: "string" },
      organisationId: { type: "string" },
      branchId: { type: "string" },
    },
  },
  user: {
    additionalFields: {
      role: { type: "string" },
      organisationId: { type: "string" },
      branchId: { type: "string" },
    },
  },
});
