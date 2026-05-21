import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { superAdminNav } from "@/components/layout/nav-config";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    console.error("[super-admin layout] getSession threw:", err);
    redirect("/login");
  }
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#0B0B18]">
      <Sidebar
        navItems={superAdminNav}
        orgName="TPAPOS Platform"
        orgLogoUrl="/logo.png"
        userName={session.user.name ?? "Super Admin"}
        userRole="SUPER ADMIN"
      />
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-width)" }}>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
