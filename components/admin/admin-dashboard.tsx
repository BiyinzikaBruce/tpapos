"use client";

import { RevenueChart } from "./revenue-chart";
import { BranchChart } from "./branch-chart";
import { formatUGX, formatUGXShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ShoppingCart, Building2, Package, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const METHOD_LABELS: Record<string, string> = { CASH: "Cash", MTN_MOMO: "MTN MoMo", AIRTEL_MONEY: "Airtel Money" };
const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MTN_MOMO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  AIRTEL_MONEY: "bg-red-500/20 text-red-400 border-red-500/30",
};

type Props = {
  stats: { revenue: number; revenueTrend: number; salesCount: number; countTrend: number; branches: number; products: number; users: number };
  chartData: { label: string; total: number }[];
  branchData: { name: string; revenue: number; salesCount: number }[];
  paymentData: Record<string, number>;
  recentSales: { id: string; cashier: string; branch: string; paymentMethod: string; total: number; itemCount: number; createdAt: string }[];
};

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", up ? "text-emerald-400" : "text-red-400")}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function AdminDashboard({ stats, chartData, branchData, paymentData, recentSales }: Props) {
  const totalPayment = Object.values(paymentData).reduce((a, b) => a + b, 0);

  const statCards = [
    { label: "Revenue (This Month)", value: formatUGX(stats.revenue), trend: stats.revenueTrend, icon: CreditCard, accent: true },
    { label: "Sales (This Month)", value: stats.salesCount.toLocaleString(), trend: stats.countTrend, icon: ShoppingCart, accent: false },
    { label: "Branches", value: stats.branches.toString(), trend: null, icon: Building2, accent: false },
    { label: "Active Products", value: stats.products.toString(), trend: null, icon: Package, accent: false },
    { label: "Staff Members", value: stats.users.toString(), trend: null, icon: Users, accent: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Dashboard</h1>
        <p className="text-sm text-[#5C5A7A] mt-0.5">
          {new Date().toLocaleDateString("en-UG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#5C5A7A]">{card.label}</p>
                <Icon className="w-4 h-4 text-[#3A3A60]" />
              </div>
              <p className={cn("text-xl font-bold", card.accent ? "text-[#7C3AED]" : "text-[#F1F0FF]")}>{card.value}</p>
              {card.trend !== null && (
                <div className="mt-1">
                  <TrendBadge value={card.trend} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-xl border p-5" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#F1F0FF]">Revenue — Last 30 Days</h3>
              <p className="text-xs text-[#5C5A7A] mt-0.5">{formatUGX(chartData.reduce((s, d) => s + d.total, 0))} total</p>
            </div>
          </div>
          <RevenueChart data={chartData as never} />
        </div>

        {/* Payment breakdown */}
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
          <h3 className="font-semibold text-[#F1F0FF] mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {Object.entries(paymentData).map(([method, amount]) => {
              const pct = totalPayment > 0 ? (amount / totalPayment) * 100 : 0;
              return (
                <div key={method}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#A09EC0]">{METHOD_LABELS[method]}</span>
                    <span className="text-[#F1F0FF] font-medium">{formatUGXShort(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-[#1E1E35] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C3AED] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Branch chart below */}
          <h3 className="font-semibold text-[#F1F0FF] mt-6 mb-4">Revenue by Branch</h3>
          <BranchChart data={branchData} />
        </div>
      </div>

      {/* Recent sales */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <h3 className="font-semibold text-[#F1F0FF]">Recent Sales</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-[#5C5A7A] uppercase tracking-wide" style={{ borderColor: "var(--color-border-subtle)" }}>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Cashier</th>
              <th className="px-5 py-3">Branch</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale, i) => (
              <tr key={sale.id} className={cn("hover:bg-[#12122A] transition-colors", i !== recentSales.length - 1 && "border-b")} style={{ borderColor: "var(--color-border-subtle)" }}>
                <td className="px-5 py-3 text-[#5C5A7A]">{format(new Date(sale.createdAt), "MMM d, HH:mm")}</td>
                <td className="px-5 py-3 text-[#F1F0FF]">{sale.cashier}</td>
                <td className="px-5 py-3 text-[#A09EC0]">{sale.branch}</td>
                <td className="px-5 py-3 text-[#A09EC0]">{sale.itemCount}</td>
                <td className="px-5 py-3">
                  <Badge className={cn("text-xs border", METHOD_COLORS[sale.paymentMethod])}>
                    {METHOD_LABELS[sale.paymentMethod]}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right font-semibold text-[#7C3AED]">{formatUGX(sale.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
