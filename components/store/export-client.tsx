"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Package, ClipboardList, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type Branch = { id: string; name: string };

async function downloadCSV(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ExportClient({ branches, defaultBranchId }: { branches: Branch[]; defaultBranchId: string }) {
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExport(type: string) {
    setLoading(type);
    try {
      const params = new URLSearchParams({ type });
      if (branchId) params.set("branchId", branchId);
      await downloadCSV(`/api/export?${params}`, `${type}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`${type} exported successfully`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(null);
    }
  }

  const exports = [
    { type: "inventory", icon: Package, label: "Stock Levels", desc: "Current quantity for all products across branches" },
    { type: "stock-entries", icon: ClipboardList, label: "Stock Entries", desc: "All IN / OUT / TRANSFER movements with dates" },
    { type: "sales", icon: ShoppingCart, label: "Sales History", desc: "All completed sales with items and payment method" },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm"
        >
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <span className="text-xs text-[#5C5A7A]">Filter export by branch (optional)</span>
      </div>

      {exports.map(({ type, icon: Icon, label, desc }) => (
        <div key={type} className="rounded-xl border p-5 flex items-center justify-between gap-4" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="font-semibold text-[#F1F0FF] text-sm">{label}</p>
              <p className="text-xs text-[#5C5A7A] mt-0.5">{desc}</p>
            </div>
          </div>
          <Button
            onClick={() => handleExport(type)}
            disabled={loading === type}
            size="sm"
            variant="outline"
            className="border-[#2A2A45] text-[#A09EC0] hover:text-[#F1F0FF] hover:border-[#7C3AED] flex-shrink-0 h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {loading === type ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      ))}
    </div>
  );
}
