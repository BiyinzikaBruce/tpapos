import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { POSScreen } from "@/components/cashier/pos-screen";

export default async function CashierPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const organisationId = session.user.organisationId;
  const branchId = session.user.branchId;

  if (!organisationId || !branchId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-[#A09EC0]">Your account is not assigned to a branch. Contact your admin.</p>
      </div>
    );
  }

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { organisationId, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        branchStocks: { where: { branchId }, select: { quantity: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: { organisationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    imageUrl: p.imageUrl,
    price: Number(p.price),
    unit: p.unit,
    category: p.category,
    stock: p.branchStocks[0]?.quantity ?? 0,
  }));

  return (
    <POSScreen
      organisationId={organisationId}
      branchId={branchId}
      cashierName={session.user.name}
      initialProducts={serialized}
      initialCategories={categories}
    />
  );
}
