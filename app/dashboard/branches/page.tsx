import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BranchesClient } from "@/components/admin/branches-client";

export default async function AdminBranchesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const [branches, org] = await Promise.all([
    db.branch.findMany({
      where: { organisationId: orgId },
      include: { _count: { select: { users: true, sales: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.organisation.findUnique({ where: { id: orgId }, select: { plan: true } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Branches</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Manage your business locations</p>
      </div>
      <BranchesClient initialBranches={branches} plan={(org?.plan as "FREE" | "PRO") ?? "FREE"} />
    </div>
  );
}
