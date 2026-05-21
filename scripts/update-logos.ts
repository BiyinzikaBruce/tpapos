import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.organisation.updateMany({ data: { logoUrl: "/logo.png" } });
  console.log("Updated all org logos to /logo.png");
}

main().finally(() => db.$disconnect());
