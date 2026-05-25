"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, CheckCircle, TrendingUp, ShoppingCart, Banknote, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { formatUGX } from "@/lib/format";

type Branch = { id: string; name: string };
type Report = {
  id: string; date: Date | string; totalSales: number; cashAmount: number; momoAmount: number;
  salesCount: number; notes: string | null; isReviewed: boolean;
  cashier: { id: string; name: string };
  branch: { id: string; name: string };
};
type TodaySummary = {
  totalRevenue: number; salesCount: number; cash: number; momo: number; airtel: number;
  byBranch: { branchId: string; branchName: string; total: number; count: number }[];
};

export function ReportsClient({ initialReports, branches, todaySummary }: { initialReports: Report[]; branches: Branch[]; todaySummary: TodaySummary }) {
  const [reports, setReports] = useState(initialReports);
  const [branchFilter, setBranchFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState<Report | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const filtered = reports.filter((r) => {
    const matchBranch = !branchFilter || r.branch.id === branchFilter;
    const matchDate = !dateFilter || new Date(r.date).toISOString().slice(0, 10) === dateFilter;
    return matchBranch && matchDate;
  });

  async function markReviewed(id: string) {
    setReviewing(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, isReviewed: true } : r));
      if (selected?.id === id) setSelected((s) => s ? { ...s, isReviewed: true } : null);
      toast.success("Marked as reviewed");
    } catch {
      toast.error("Failed to mark as reviewed");
    } finally {
      setReviewing(false);
    }
  }

  return (
    <>
      {/* Today's live overview */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: "#2A2A45", background: "var(--color-bg-elevated)" }}>
        <h3 className="font-semibold text-[#F1F0FF] mb-4">
          Today&apos;s Sales Overview
          <span className="text-xs font-normal text-[#5C5A7A] ml-2">{format(new Date(), "MMMM d, yyyy")}</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Revenue", value: formatUGX(todaySummary.totalRevenue), icon: TrendingUp, color: "text-[#7C3AED]" },
            { label: "Sales Made", value: todaySummary.salesCount.toString(), icon: ShoppingCart, color: "text-[#F1F0FF]" },
            { label: "Cash", value: formatUGX(todaySummary.cash), icon: Banknote, color: "text-emerald-400" },
            { label: "Mobile Money", value: formatUGX(todaySummary.momo + todaySummary.airtel), icon: Smartphone, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg bg-[#12122A] border border-[#2A2A45] p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#5C5A7A]">{label}</p>
                <Icon className="w-3.5 h-3.5 text-[#3A3A60]" />
              </div>
              <p className={`text-base font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        {todaySummary.byBranch.length > 0 ? (
          <div className="border-t border-[#2A2A45] pt-4">
            <p className="text-xs text-[#5C5A7A] mb-2">Revenue by Branch</p>
            <div className="space-y-2">
              {todaySummary.byBranch.map((b) => (
                <div key={b.branchId} className="flex items-center justify-between text-sm">
                  <span className="text-[#A09EC0]">{b.branchName}</span>
                  <span className="text-[#F1F0FF]">{b.count} {b.count === 1 ? "sale" : "sales"} · {formatUGX(b.total)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#5C5A7A] border-t border-[#2A2A45] pt-4">No sales recorded today yet.</p>
        )}
      </div>

      {/* Cashier reports filters */}
      <h3 className="font-semibold text-[#F1F0FF] mb-3">Cashier Reports</h3>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="h-9 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter("")} className="text-xs text-[#5C5A7A] hover:text-[#F1F0FF]">Clear date</button>
        )}
        <span className="text-sm text-[#5C5A7A] ml-auto">{filtered.length} reports</span>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#2A2A45" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#12122A] border-b border-[#2A2A45]">
              {["Date", "Branch", "Cashier", "Sales", "Cash", "MoMo", "Total", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[#5C5A7A] font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-[#5C5A7A]"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No reports yet</p></td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-b border-[#1E1E35] hover:bg-[#12122A] transition-colors cursor-pointer" onClick={() => setSelected(r)}>
                <td className="px-4 py-3 text-[#A09EC0]">{format(new Date(r.date), "MMM d, yyyy")}</td>
                <td className="px-4 py-3 text-[#F1F0FF]">{r.branch.name}</td>
                <td className="px-4 py-3 text-[#A09EC0]">{r.cashier.name}</td>
                <td className="px-4 py-3 text-[#A09EC0]">{r.salesCount}</td>
                <td className="px-4 py-3 text-[#A09EC0]">UGX {r.cashAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#A09EC0]">UGX {r.momoAmount.toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-[#F1F0FF]">UGX {r.totalSales.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {r.isReviewed
                    ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Reviewed</Badge>
                    : <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Pending</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="text-[#F1F0FF]">Daily Report</SheetTitle>
                <p className="text-xs text-[#5C5A7A]">{format(new Date(selected.date), "MMMM d, yyyy")}</p>
              </SheetHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Branch</p><p className="text-[#F1F0FF]">{selected.branch.name}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Cashier</p><p className="text-[#F1F0FF]">{selected.cashier.name}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Total Sales</p><p className="text-[#F1F0FF] font-semibold">UGX {selected.totalSales.toLocaleString()}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">No. of Sales</p><p className="text-[#F1F0FF]">{selected.salesCount}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Cash</p><p className="text-[#F1F0FF]">UGX {selected.cashAmount.toLocaleString()}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">MoMo</p><p className="text-[#F1F0FF]">UGX {selected.momoAmount.toLocaleString()}</p></div>
                </div>
                {selected.notes && (
                  <div className="rounded-lg bg-[#12122A] p-3">
                    <p className="text-xs text-[#5C5A7A] mb-1">Notes</p>
                    <p className="text-sm text-[#A09EC0]">{selected.notes}</p>
                  </div>
                )}
                {!selected.isReviewed && (
                  <Button
                    onClick={() => markReviewed(selected.id)}
                    disabled={reviewing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {reviewing ? "Marking..." : "Mark as Reviewed"}
                  </Button>
                )}
                {selected.isReviewed && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm justify-center py-2">
                    <CheckCircle className="w-4 h-4" /> Report reviewed
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
