import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { storeManagerNav } from "@/components/layout/nav-config";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const org = session.user.organisationId
    ? await db.organisation.findUnique({
        where: { id: session.user.organisationId },
        select: { name: true, logoUrl: true },
      })
    : null;

  return (
    <div className="flex min-h-screen bg-[#0B0B18]">
      <Sidebar
        navItems={storeManagerNav}
        orgName={org?.name ?? "TPAPOS"}
        orgLogoUrl={org?.logoUrl ?? "/logo.png"}
        userName={session.user.name}
        userRole="STORE_MANAGER"
      />
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-width)" }}>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
