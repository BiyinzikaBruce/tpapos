import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { InventoryClient } from "@/components/store/inventory-client";

export default async function InventoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const orgId = session.user.organisationId ?? "";
  const branchId = session.user.branchId ?? "";

  const [branches, categories] = await Promise.all([
    db.branch.findMany({ where: { organisationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ where: { organisationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Inventory</h1>
        <p className="text-sm text-[#A09EC0] mt-1">Monitor stock levels across branches</p>
      </div>
      <InventoryClient
        orgId={orgId}
        defaultBranchId={branchId}
        branches={branches}
        categories={categories}
        lowStockThreshold={10}
      />
    </div>
  );
}
