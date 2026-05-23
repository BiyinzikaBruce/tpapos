import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CategoriesClient } from "@/components/admin/categories-client";

export default async function CategoriesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const categories = await db.category.findMany({
    where: { organisationId: orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Categories</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Organise your products into categories</p>
      </div>
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
