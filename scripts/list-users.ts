import { db } from "../lib/db";

async function main() {
  const users = await db.user.findMany({
    select: { email: true, name: true, role: true, branchId: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  for (const u of users) {
    console.log(`${u.role.padEnd(14)} | ${u.email.padEnd(40)} | ${u.name}`);
  }

  await db.$disconnect();
}

main();
