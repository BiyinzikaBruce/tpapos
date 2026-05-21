import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/admin/settings-client";

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const org = await db.organisation.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, plan: true, lowStockThreshold: true, logoUrl: true },
  });
  if (!org) redirect("/login");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Settings</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Organisation preferences and configuration</p>
      </div>
      <SettingsClient org={org} user={{ id: session.user.id, name: session.user.name, email: session.user.email }} />
    </div>
  );
}
