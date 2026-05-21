import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as never);

async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true } });
  console.log(`Fixing ${users.length} users — updating user.passwordHash and account records...`);

  for (const user of users) {
    const hashed = await hashPassword("Password123!");

    // Update user.passwordHash (some BA versions read this)
    await db.user.update({ where: { id: user.id }, data: { passwordHash: hashed } });

    // Upsert account record — this is what Better Auth actually checks for credential logins
    const existing = await db.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (existing) {
      await db.account.update({ where: { id: existing.id }, data: { password: hashed, updatedAt: new Date() } });
    } else {
      await db.account.create({
        data: { userId: user.id, accountId: user.id, providerId: "credential", password: hashed, createdAt: new Date(), updatedAt: new Date() },
      });
    }

    console.log(`  ✓ ${user.email}`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => db.$disconnect());
