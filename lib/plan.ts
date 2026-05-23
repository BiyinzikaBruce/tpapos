import { db } from "./db";

export async function getOrgPlan(orgId: string): Promise<"FREE" | "PRO"> {
  const org = await db.organisation.findUnique({ where: { id: orgId }, select: { plan: true } });
  return (org?.plan as "FREE" | "PRO") ?? "FREE";
}

export async function requirePro(orgId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = await getOrgPlan(orgId);
  if (plan !== "PRO") return { ok: false, error: "This feature requires a PRO plan. Ask your super admin to upgrade." };
  return { ok: true };
}

export async function canAddBranch(orgId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = await getOrgPlan(orgId);
  if (plan === "PRO") return { ok: true };
  const count = await db.branch.count({ where: { organisationId: orgId } });
  if (count >= 1) return { ok: false, error: "FREE plan is limited to 1 branch. Upgrade to PRO for unlimited branches." };
  return { ok: true };
}
