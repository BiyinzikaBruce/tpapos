import { db } from "@/lib/db";
import { Shield, Building2, Users, Package, ShoppingCart } from "lucide-react";

export default async function SuperAdminPlatformPage() {
  const [orgCount, userCount, productCount, saleCount] = await Promise.all([
    db.organisation.count(),
    db.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    db.product.count(),
    db.sale.count(),
  ]);

  const recentOrgs = await db.organisation.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { _count: { select: { branches: true, users: true } } },
  });

  const stats = [
    { icon: Building2, label: "Organisations", value: orgCount, color: "#7C3AED" },
    { icon: Users, label: "Total Users", value: userCount, color: "#10B981" },
    { icon: Package, label: "Products", value: productCount, color: "#FBBF24" },
    { icon: ShoppingCart, label: "Total Sales", value: saleCount, color: "#EF4444" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#7C3AED]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F1F0FF]">Platform Overview</h1>
          <p className="text-sm text-[#5C5A7A]">TPAPOS super admin console</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-[#F1F0FF]">{value.toLocaleString()}</p>
            <p className="text-xs text-[#5C5A7A] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orgs */}
      <div className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
        <h3 className="text-sm font-semibold text-[#F1F0FF] mb-4">Recent Organisations</h3>
        <div className="space-y-3">
          {recentOrgs.map((org) => (
            <div key={org.id} className="flex items-center justify-between py-2 border-b border-[#1E1E35] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-xs font-bold">
                  {org.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F0FF]">{org.name}</p>
                  <p className="text-xs text-[#5C5A7A]">{org._count.branches} branches · {org._count.users} users</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${org.plan === "PRO" ? "bg-amber-500/10 text-amber-400" : "bg-[#2A2A45] text-[#5C5A7A]"}`}>{org.plan}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
