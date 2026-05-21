import { db } from "@/lib/db";
import { OrganisationsClient } from "@/components/super-admin/organisations-client";

export default async function SuperAdminOrganisationsPage() {
  const orgs = await db.organisation.findMany({
    include: { _count: { select: { branches: true, users: true, products: true, sales: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Organisations</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Manage all tenants on the platform</p>
      </div>
      <OrganisationsClient initialOrgs={orgs} />
    </div>
  );
}
