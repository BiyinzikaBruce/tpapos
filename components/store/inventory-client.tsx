"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/format";
import { Search, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type StockItem = {
  id: string;
  quantity: number;
  branchName: string;
  product: { id: string; name: string; sku: string | null; unit: string; price: number; category: { name: string } };
};

type Branch = { id: string; name: string };
type Category = { id: string; name: string };

interface Props {
  orgId: string;
  defaultBranchId: string;
  branches: Branch[];
  categories: Category[];
  lowStockThreshold: number;
}

export function InventoryClient({ defaultBranchId, branches, categories, lowStockThreshold }: Props) {
  const [branchId, setBranchId] = useState(defaultBranchId || branches[0]?.id || "");
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "low" | "out">("all");

  const { data: stock = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["stock", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/stock?branchId=${branchId}`);
      if (!res.ok) throw new Error("Failed to load stock");
      return res.json();
    },
    enabled: !!branchId,
  });

  const filtered = useMemo(() => {
    return stock.filter((item) => {
      const matchesSearch = item.product.name.toLowerCase().includes(search.toLowerCase()) || (item.product.sku ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCat === "all" || item.product.category.name === selectedCat;
      const matchesStatus =
        statusFilter === "all" ? true :
        statusFilter === "out" ? item.quantity === 0 :
        item.quantity > 0 && item.quantity <= lowStockThreshold;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [stock, search, selectedCat, statusFilter, lowStockThreshold]);

  const lowCount = stock.filter((i) => i.quantity > 0 && i.quantity <= lowStockThreshold).length;
  const outCount = stock.filter((i) => i.quantity === 0).length;

  function getStatus(qty: number) {
    if (qty === 0) return { label: "Out of Stock", cls: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (qty <= lowStockThreshold) return { label: "Low Stock", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    return { label: "OK", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Branch select */}
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-9 rounded-lg border border-[#2A2A45] bg-[#12122A] text-[#F1F0FF] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          >
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-9 rounded-lg border border-[#2A2A45] bg-[#12122A] text-[#F1F0FF] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          {/* Status filter pills */}
          {(["all", "low", "out"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn("px-3 h-9 rounded-lg text-xs font-medium border transition-colors", statusFilter === s ? "bg-[#7C3AED] text-white border-[#7C3AED]" : "bg-[#12122A] text-[#A09EC0] border-[#2A2A45] hover:border-[#7C3AED]/50")}
            >
              {s === "all" ? `All (${stock.length})` : s === "low" ? `Low (${lowCount})` : `Out (${outCount})`}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5C5A7A]" />
            <Input
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-48 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] text-sm"
            />
          </div>
          <Button asChild size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
            <Link href="/store/inventory/entry"><Plus className="w-3.5 h-3.5 mr-1.5" />Stock Entry</Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
          <p>No products match your filters</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border-subtle)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-[#5C5A7A] uppercase tracking-wide" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const status = getStatus(item.quantity);
                const isLow = item.quantity <= lowStockThreshold;
                return (
                  <tr key={item.id} className={cn("transition-colors", isLow && item.quantity > 0 ? "bg-amber-500/5" : item.quantity === 0 ? "bg-red-500/5" : "", i !== filtered.length - 1 && "border-b")} style={{ borderColor: "var(--color-border-subtle)" }}>
                    <td className="px-4 py-3 font-medium text-[#F1F0FF]">{item.product.name}</td>
                    <td className="px-4 py-3 text-[#A09EC0]">{item.product.category.name}</td>
                    <td className="px-4 py-3 text-[#5C5A7A] text-xs font-mono">{item.product.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-[#A09EC0]">{formatUGX(item.product.price)}</td>
                    <td className={cn("px-4 py-3 text-right font-bold", item.quantity === 0 ? "text-red-400" : item.quantity <= lowStockThreshold ? "text-amber-400" : "text-[#F1F0FF]")}>{item.quantity}</td>
                    <td className="px-4 py-3 text-[#5C5A7A]">{item.product.unit}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs border", status.cls)}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
