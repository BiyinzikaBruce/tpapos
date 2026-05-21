import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { superAdminNav } from "@/components/layout/nav-config";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0B0B18]">
      <Sidebar navItems={superAdminNav} />
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-width)" }}>
        <PageHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
