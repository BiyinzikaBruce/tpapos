import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SalesClient } from "@/components/admin/sales-client";

export default async function AdminSalesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const branches = await db.branch.findMany({
    where: { organisationId: orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Sales</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">All transactions across your branches</p>
      </div>
      <SalesClient branches={branches} />
    </div>
  );
}
