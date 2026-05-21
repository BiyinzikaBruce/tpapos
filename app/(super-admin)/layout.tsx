import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { superAdminNav } from "@/components/layout/nav-config";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#0B0B18]">
      <Sidebar
        navItems={superAdminNav}
        orgName="TPAPOS Platform"
        orgLogoUrl="/logo.png"
        userName={session.user.name}
        userRole="SUPER ADMIN"
      />
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-width)" }}>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
