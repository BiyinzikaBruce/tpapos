"use client";

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatUGXShort } from "@/lib/format";
import { TrendingUp, ShoppingCart, DollarSign, CreditCard } from "lucide-react";

type DayData = { label: string; total: number; cash: number; momo: number; count: number };
type BranchData = { name: string; revenue: number; salesCount: number };

interface Props {
  dailySeries: DayData[];
  branchData: BranchData[];
  pmTotals: Record<string, number>;
  totalRevenue: number;
  totalSales: number;
  avgSaleValue: number;
}

const PM_LABELS: Record<string, string> = { CASH: "Cash", MTN_MOMO: "MTN MoMo", AIRTEL_MONEY: "Airtel Money" };
const PM_COLORS: Record<string, string> = { CASH: "#10B981", MTN_MOMO: "#FBBF24", AIRTEL_MONEY: "#EF4444" };

export function AnalyticsClient({ dailySeries, branchData, pmTotals, totalRevenue, totalSales, avgSaleValue }: Props) {
  const totalPm = Object.values(pmTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: "Total Revenue (30d)", value: `UGX ${formatUGXShort(totalRevenue)}`, color: "#7C3AED" },
          { icon: ShoppingCart, label: "Total Sales (30d)", value: totalSales.toLocaleString(), color: "#10B981" },
          { icon: DollarSign, label: "Avg. Sale Value", value: `UGX ${Math.round(avgSaleValue).toLocaleString()}`, color: "#FBBF24" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-4.5 h-4.5" style={{ color }} />
              </div>
              <p className="text-xs text-[#5C5A7A]">{label}</p>
            </div>
            <p className="text-xl font-bold text-[#F1F0FF]">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
        <h3 className="text-sm font-semibold text-[#F1F0FF] mb-4">Revenue Trend (30 days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailySeries} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E35" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#5C5A7A", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={formatUGXShort} tick={{ fill: "#5C5A7A", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#12122A", border: "1px solid #2A2A45", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#A09EC0" }}
              formatter={(v) => [`UGX ${Number(v).toLocaleString()}`, "Revenue"]}
            />
            <Area type="monotone" dataKey="total" stroke="#7C3AED" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Branch performance */}
        <div className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
          <h3 className="text-sm font-semibold text-[#F1F0FF] mb-4">Revenue by Branch</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E35" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#5C5A7A", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatUGXShort} tick={{ fill: "#5C5A7A", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#12122A", border: "1px solid #2A2A45", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#A09EC0" }}
                formatter={(v) => [`UGX ${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment methods */}
        <div className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
          <h3 className="text-sm font-semibold text-[#F1F0FF] mb-4">Payment Methods</h3>
          <div className="space-y-3 mt-2">
            {Object.entries(pmTotals).map(([method, amount]) => {
              const pct = totalPm > 0 ? (amount / totalPm) * 100 : 0;
              return (
                <div key={method}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#A09EC0] flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" />{PM_LABELS[method] ?? method}
                    </span>
                    <span className="text-[#F1F0FF] font-medium">UGX {amount.toLocaleString()} <span className="text-[#5C5A7A] font-normal">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1E1E35] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PM_COLORS[method] ?? "#7C3AED" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sales volume chart */}
      <div className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
        <h3 className="text-sm font-semibold text-[#F1F0FF] mb-4">Daily Sales Count</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailySeries} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E35" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#5C5A7A", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#5C5A7A", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#12122A", border: "1px solid #2A2A45", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#A09EC0" }}
              formatter={(v) => [v, "Sales"]}
            />
            <Bar dataKey="count" fill="#10B981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
