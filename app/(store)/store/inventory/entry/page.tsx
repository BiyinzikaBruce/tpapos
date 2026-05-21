import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StockEntryForm } from "@/components/store/stock-entry-form";

export default async function StockEntryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const orgId = session.user.organisationId ?? "";
  const [products, branches, suppliers] = await Promise.all([
    db.product.findMany({ where: { organisationId: orgId, isActive: true }, select: { id: true, name: true, sku: true }, orderBy: { name: "asc" } }),
    db.branch.findMany({ where: { organisationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { organisationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Stock Entry</h1>
        <p className="text-sm text-[#A09EC0] mt-1">Record stock in, out, or transfer between branches</p>
      </div>
      <StockEntryForm
        defaultBranchId={session.user.branchId ?? ""}
        products={products}
        branches={branches}
        suppliers={suppliers}
      />
    </div>
  );
}
