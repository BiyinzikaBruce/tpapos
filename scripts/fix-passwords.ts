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
  console.log(`Fixing passwords for ${users.length} users...`);

  for (const user of users) {
    const hashed = await hashPassword("Password123!");
    await db.user.update({ where: { id: user.id }, data: { passwordHash: hashed } });
    console.log(`  ✓ ${user.email}`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => db.$disconnect());
