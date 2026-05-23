import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentsClient } from "@/components/documents/documents-client";

export default async function CashierDocumentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  const branchId = (session.user as { branchId?: string }).branchId;
  if (!orgId || !branchId) redirect("/cashier");

  const org = await db.organisation.findUnique({ where: { id: orgId }, select: { plan: true } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Documents</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Upload cheques and payment receipts for your branch</p>
      </div>
      <DocumentsClient
        plan={(org?.plan as "FREE" | "PRO") ?? "FREE"}
        canUpload={true}
        orgId={orgId}
        branchId={branchId}
      />
    </div>
  );
}
