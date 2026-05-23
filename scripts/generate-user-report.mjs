import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";

// Load .env.local
const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows: users } = await client.query(
  `SELECT u.email, u.name, u.role, b.name AS branch, o.name AS organisation
   FROM "user" u
   LEFT JOIN "branch" b ON u."branchId" = b.id
   LEFT JOIN "organisation" o ON u."organisationId" = o.id
   ORDER BY u.role, u.name`
);

const { rows: orgs } = await client.query(
  `SELECT o.name, o.plan, COUNT(DISTINCT b.id) AS branches, COUNT(DISTINCT u.id) AS users,
          COUNT(DISTINCT p.id) AS products, COUNT(DISTINCT s.id) AS sales
   FROM "organisation" o
   LEFT JOIN "branch" b ON b."organisationId" = o.id
   LEFT JOIN "user" u ON u."organisationId" = o.id
   LEFT JOIN "product" p ON p."organisationId" = o.id
   LEFT JOIN "sale" s ON s."organisationId" = o.id
   GROUP BY o.id, o.name, o.plan
   ORDER BY o.name`
);

await client.end();

const now = new Date().toLocaleString("en-UG", { timeZone: "Africa/Kampala", dateStyle: "full", timeStyle: "short" });

const roleColor = { SUPER_ADMIN: "#7C3AED", ADMIN: "#2563EB", MANAGER: "#059669", STORE_MANAGER: "#D97706", CASHIER: "#6B7280" };
const roleLabel = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MANAGER: "Manager", STORE_MANAGER: "Store Manager", CASHIER: "Cashier" };

const userRows = users.map(u => `
  <tr>
    <td>${u.name}</td>
    <td>${u.email}</td>
    <td><span class="badge" style="background:${roleColor[u.role]}20;color:${roleColor[u.role]};border:1px solid ${roleColor[u.role]}40">${roleLabel[u.role] ?? u.role}</span></td>
    <td>${u.organisation ?? "—"}</td>
    <td>${u.branch ?? "—"}</td>
    <td class="pw">Password123!</td>
  </tr>`).join("");

const orgRows = orgs.map(o => `
  <tr>
    <td>${o.name}</td>
    <td><span class="badge" style="background:${o.plan==="PRO"?"#D9770620":"#6B728020"};color:${o.plan==="PRO"?"#D97706":"#6B7280"}">${o.plan}</span></td>
    <td>${o.branches}</td>
    <td>${o.users}</td>
    <td>${o.products}</td>
    <td>${o.sales}</td>
  </tr>`).join("");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>TPAPOS — Pre-Wipe User Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; padding: 40px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #7C3AED; }
  .logo-area h1 { font-size: 22px; font-weight: 800; color: #7C3AED; letter-spacing: -0.5px; }
  .logo-area p { color: #555; margin-top: 4px; font-size: 12px; }
  .meta { text-align: right; font-size: 11px; color: #888; line-height: 1.6; }
  .warning { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px; color: #92400E; font-size: 12px; font-weight: 500; }
  h2 { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  section { margin-bottom: 32px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #F5F3FF; color: #7C3AED; font-weight: 700; text-align: left; padding: 8px 10px; border-bottom: 2px solid #DDD6FE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
  tr:hover td { background: #FAFAFA; }
  .badge { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .pw { font-family: 'Courier New', monospace; font-weight: 700; color: #7C3AED; background: #F5F3FF; padding: 3px 8px; border-radius: 4px; display: inline-block; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #aaa; font-size: 11px; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo-area">
    <h1>TPAPOS</h1>
    <p>Pre-Wipe User & Data Report</p>
  </div>
  <div class="meta">
    Generated: ${now}<br>
    Database: Neon PostgreSQL (eu-west-2)<br>
    Total users: ${users.length} &nbsp;|&nbsp; Total orgs: ${orgs.length}
  </div>
</div>

<div class="warning">
  ⚠️ This report was generated immediately before a full database wipe. Keep it safe — these are the only records of user credentials.
</div>

<section>
  <h2>All Users &amp; Credentials</h2>
  <table>
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organisation</th><th>Branch</th><th>Password</th></tr></thead>
    <tbody>${userRows}</tbody>
  </table>
</section>

<section>
  <h2>Organisations Summary</h2>
  <table>
    <thead><tr><th>Organisation</th><th>Plan</th><th>Branches</th><th>Users</th><th>Products</th><th>Sales</th></tr></thead>
    <tbody>${orgRows}</tbody>
  </table>
</section>

<div class="footer">
  TPAPOS — Tech Power Africa POS &nbsp;|&nbsp; Confidential — Do not share
</div>
</body>
</html>`;

const outPath = resolve(process.cwd(), "TPAPOS-user-report.html");
writeFileSync(outPath, html, "utf-8");
console.log(`\nReport saved to: ${outPath}`);
console.log("Open it in your browser and press Ctrl+P → Save as PDF\n");
