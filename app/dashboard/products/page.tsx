import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProductsClient } from "@/components/admin/products-client";

export default async function AdminProductsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const categories = await db.category.findMany({
    where: { organisationId: orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const products = await db.product.findMany({
    where: { organisationId: orgId },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Products</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Manage your product catalogue</p>
      </div>
      <ProductsClient
        initialProducts={products.map((p) => ({ ...p, price: Number(p.price), costPrice: p.costPrice ? Number(p.costPrice) : null }))}
        categories={categories}
      />
    </div>
  );
}
