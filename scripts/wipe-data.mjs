import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";

const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log("Starting database wipe (keeping SUPER_ADMIN account)...\n");

// Delete in FK-safe order using TRUNCATE CASCADE where possible,
// otherwise explicit ordered deletes.
const steps = [
  ["audit_log",            `DELETE FROM audit_log`],
  ["notification",         `DELETE FROM notification`],
  ["message",              `DELETE FROM message`],
  ["daily_report",         `DELETE FROM daily_report`],
  ["sale_item",            `DELETE FROM sale_item`],
  ["sale",                 `DELETE FROM sale`],
  ["stock_entry",          `DELETE FROM stock_entry`],
  ["product_branch_stock", `DELETE FROM product_branch_stock`],
  ["product",              `DELETE FROM product`],
  ["supplier",             `DELETE FROM supplier`],
  ["category",             `DELETE FROM category`],
  // Sessions & accounts for non-super-admin users
  ["session (non-SA)",     `DELETE FROM session WHERE "userId" IN (SELECT id FROM "user" WHERE role != 'SUPER_ADMIN')`],
  ["account (non-SA)",     `DELETE FROM account WHERE "userId" IN (SELECT id FROM "user" WHERE role != 'SUPER_ADMIN')`],
  ["verification",         `DELETE FROM verification`],
  // Non-super-admin users
  ["user (non-SA)",        `DELETE FROM "user" WHERE role != 'SUPER_ADMIN'`],
  // Branches and orgs (no more FK deps)
  ["branch",               `DELETE FROM branch`],
  ["organisation",         `DELETE FROM organisation`],
];

for (const [label, sql] of steps) {
  const result = await client.query(sql);
  console.log(`  ✓ ${label.padEnd(25)} — ${result.rowCount ?? 0} rows deleted`);
}

const { rows } = await client.query(`SELECT name, email, role FROM "user"`);
console.log(`\nRemaining users (${rows.length}):`);
for (const u of rows) console.log(`  ${u.role.padEnd(14)} | ${u.email} | ${u.name}`);

await client.end();
console.log("\n✅ Database wiped. Ready for fresh data.\n");
