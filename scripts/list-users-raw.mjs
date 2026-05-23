import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envFile = readFileSync(envPath, "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT email, name, role, "branchId" FROM "user" ORDER BY role, name`
);

console.log("\nRole           | Email                                    | Name");
console.log("-".repeat(80));
for (const u of rows) {
  console.log(`${u.role.padEnd(14)} | ${u.email.padEnd(40)} | ${u.name}`);
}
console.log(`\nTotal: ${rows.length} users`);
console.log("Password for all seeded users: Password123!");

await client.end();
