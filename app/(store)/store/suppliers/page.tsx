import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SuppliersClient } from "@/components/store/suppliers-client";

export default async function SuppliersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const suppliers = await db.supplier.findMany({
    where: { organisationId: session.user.organisationId ?? "" },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Suppliers</h1>
        <p className="text-sm text-[#A09EC0] mt-1">Manage your product suppliers</p>
      </div>
      <SuppliersClient initialSuppliers={suppliers} />
    </div>
  );
}
