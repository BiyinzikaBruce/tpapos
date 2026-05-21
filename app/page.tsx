import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, ShoppingCart, Package, Users, Building2, ArrowRight, CheckCircle, Zap, Shield, Globe } from "lucide-react";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/dashboard",
  MANAGER: "/manager/dashboard",
  STORE_MANAGER: "/store/inventory",
  CASHIER: "/cashier",
};

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const role = (session.user as { role?: string }).role ?? "";
    redirect(ROLE_HOME[role] ?? "/login");
  }

  return (
    <div className="min-h-screen bg-[#0B0B18] text-[#F1F0FF]">
      {/* Nav */}
      <nav className="border-b border-[#1E1E35] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Tech Power Africa" width={40} height={40} className="rounded-lg object-contain" />
            <span className="font-bold text-lg">TPAPOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#A09EC0] hover:text-[#F1F0FF] transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/login" className="text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-lg transition-colors font-medium">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-full px-4 py-1.5 text-xs text-[#A78BFA] mb-8">
          <Zap className="w-3 h-3" /> Built for Ugandan businesses
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          The complete POS &amp; business
          <br />
          <span className="text-[#7C3AED]">management platform</span>
        </h1>
        <p className="text-[#A09EC0] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Manage sales, inventory, staff, and branches from one powerful platform. Built for Ugandan retailers, wholesalers, and distributors.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login" className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto border border-[#2A2A45] hover:border-[#7C3AED] text-[#A09EC0] hover:text-[#F1F0FF] px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors text-center">
            View demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Everything your business needs</h2>
          <p className="text-[#5C5A7A]">One platform for every role in your organisation</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: ShoppingCart, title: "Point of Sale", desc: "Fast, intuitive cashier interface with Cash, MTN MoMo, and Airtel Money payments.", color: "#7C3AED" },
            { icon: Package, title: "Inventory Management", desc: "Track stock levels across all branches, manage transfers, and get low-stock alerts automatically.", color: "#10B981" },
            { icon: BarChart3, title: "Analytics & Reports", desc: "Real-time revenue charts, branch performance comparisons, and daily cashier report reviews.", color: "#FBBF24" },
            { icon: Users, title: "Staff Management", desc: "Role-based access for Admin, Manager, Store Manager, and Cashier — everyone sees what they need.", color: "#EF4444" },
            { icon: Building2, title: "Multi-Branch", desc: "Manage multiple locations from one dashboard. Compare performance and share inventory across branches.", color: "#3B82F6" },
            { icon: Globe, title: "Works Everywhere", desc: "Cloud-based and mobile-responsive. Access your business data from any device, anywhere.", color: "#8B5CF6" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-2xl border border-[#1E1E35] p-6 hover:border-[#2A2A45] transition-colors bg-[#0D0D1A]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-[#5C5A7A] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="border-y border-[#1E1E35] bg-[#0D0D1A] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Designed for every team member</h2>
            <p className="text-[#5C5A7A]">Each role gets a tailored interface with exactly what they need</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: "Admin", color: "#7C3AED", perks: ["Full dashboard & analytics", "Manage branches & users", "Revenue reports", "System settings"] },
              { role: "Manager", color: "#3B82F6", perks: ["Branch performance view", "Sales history", "Review daily reports", "Staff messaging"] },
              { role: "Store Manager", color: "#10B981", perks: ["Stock level control", "Receive & transfer goods", "Supplier management", "CSV exports"] },
              { role: "Cashier", color: "#FBBF24", perks: ["Fast POS interface", "Multiple payment types", "Sales history", "Daily report submission"] },
            ].map(({ role, color, perks }) => (
              <div key={role} className="rounded-2xl border border-[#2A2A45] p-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4 text-xs font-bold text-white" style={{ background: color }}>
                  {role.charAt(0)}
                </div>
                <h3 className="font-semibold mb-3">{role}</h3>
                <ul className="space-y-2">
                  {perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-[#5C5A7A]">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
          <p className="text-[#5C5A7A]">Start free, scale as you grow</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            {
              plan: "Free", price: "UGX 0", period: "/month",
              features: ["1 branch", "Up to 5 staff", "Basic POS & inventory", "30-day analytics", "Email support"],
              cta: "Get started free", highlight: false,
            },
            {
              plan: "Pro", price: "UGX 150,000", period: "/month",
              features: ["Unlimited branches", "Unlimited staff", "Full analytics suite", "Priority support", "Custom reports & exports", "Low-stock automation"],
              cta: "Start Pro trial", highlight: true,
            },
          ].map(({ plan, price, period, features, cta, highlight }) => (
            <div key={plan} className={`rounded-2xl border p-8 ${highlight ? "border-[#7C3AED] bg-[#12122A]" : "border-[#2A2A45] bg-[#0D0D1A]"}`}>
              {highlight && <div className="text-xs font-semibold text-[#A78BFA] mb-3 uppercase tracking-wide">Most popular</div>}
              <h3 className="text-xl font-bold mb-1">{plan}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-bold">{price}</span>
                <span className="text-[#5C5A7A] text-sm mb-1">{period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#A09EC0]">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: highlight ? "#7C3AED" : "#2A2A45" }} />{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: highlight ? "#7C3AED" : "#1E1E35", color: highlight ? "#fff" : "#A09EC0" }}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#1E1E35] bg-[#0D0D1A]">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-7 h-7 text-[#7C3AED]" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to transform your business?</h2>
          <p className="text-[#5C5A7A] mb-8">
            Join businesses across Uganda using TPAPOS to manage their operations.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors">
            Get started today <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E1E35] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#3A3A60]">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="TPAPOS" width={24} height={24} className="rounded object-contain opacity-50" />
            <span>© {new Date().getFullYear()} Tech Power Africa. All rights reserved.</span>
          </div>
          <Link href="/login" className="hover:text-[#5C5A7A] transition-colors">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
