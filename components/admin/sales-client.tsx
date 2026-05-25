"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Branch = { id: string; name: string };

type SaleItem = { id: string; productId: string; quantity: number; unitPrice: number; total: number; product: { name: string; unit: string } };
type Sale = {
  id: string; createdAt: string; total: number; subtotal: number; discount: number;
  paymentMethod: string; status: string;
  cashier: { id: string; name: string };
  branch: { id: string; name: string };
  items: SaleItem[];
};

const PM_LABELS: Record<string, string> = { CASH: "Cash", MTN_MOMO: "MTN MoMo", AIRTEL_MONEY: "Airtel" };

export function SalesClient({ branches, defaultBranchId = "" }: { branches: Branch[]; defaultBranchId?: string }) {
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const params = new URLSearchParams({ page: String(page) });
  if (branchId) params.set("branchId", branchId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const { data, isLoading } = useQuery<{ sales: Sale[]; total: number; pages: number; page: number }>({
    queryKey: ["admin-sales", branchId, from, to, page],
    queryFn: () => fetch(`/api/admin/sales?${params}`).then((r) => r.json()),
  });

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/sales/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      toast.success("Sale deleted");
    } catch {
      toast.error("Failed to delete sale");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm"
        >
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <Input
          type="date" value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="h-9 w-36 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] text-sm"
        />
        <span className="text-[#5C5A7A] self-center text-sm">to</span>
        <Input
          type="date" value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="h-9 w-36 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] text-sm"
        />
        {(from || to || branchId) && (
          <Button size="sm" variant="ghost" className="h-9 text-[#5C5A7A]" onClick={() => { setFrom(""); setTo(""); setBranchId(""); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#2A2A45" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#12122A] border-b border-[#2A2A45]">
                {["Date & Time", "Branch", "Cashier", "Items", "Payment", "Total", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[#5C5A7A] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#5C5A7A]">Loading...</td></tr>
              ) : !data?.sales.length ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#5C5A7A]">No sales found</td></tr>
              ) : data.sales.map((s) => (
                <tr key={s.id} className="border-b border-[#1E1E35] hover:bg-[#12122A] transition-colors cursor-pointer" onClick={() => setSelected(s)}>
                  <td className="px-4 py-3 text-[#A09EC0]">{format(new Date(s.createdAt), "MMM d, yyyy HH:mm")}</td>
                  <td className="px-4 py-3 text-[#F1F0FF]">{s.branch.name}</td>
                  <td className="px-4 py-3 text-[#A09EC0]">{s.cashier.name}</td>
                  <td className="px-4 py-3 text-[#A09EC0]">{s.items.length}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-[#2A2A45] text-[#A09EC0] text-xs">{PM_LABELS[s.paymentMethod] ?? s.paymentMethod}</Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#F1F0FF]">UGX {s.total.toLocaleString()}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {deletingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-[#5C5A7A] hover:text-[#F1F0FF]" onClick={() => setDeletingId(null)}>Cancel</Button>
                        <Button size="sm" disabled={isDeleting} className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(s.id)}>
                          {isDeleting ? "..." : "Delete"}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-red-400" onClick={() => setDeletingId(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#5C5A7A]">
          <span>{data.total} sales total</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 p-0 text-[#5C5A7A]">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-[#A09EC0]">Page {page} of {data.pages}</span>
            <Button size="sm" variant="ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 p-0 text-[#5C5A7A]">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sale detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="text-[#F1F0FF]">Sale Receipt</SheetTitle>
                <p className="text-xs text-[#5C5A7A]">{format(new Date(selected.createdAt), "MMMM d, yyyy 'at' HH:mm")}</p>
              </SheetHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Branch</p><p className="text-[#F1F0FF]">{selected.branch.name}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Cashier</p><p className="text-[#F1F0FF]">{selected.cashier.name}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Payment</p><p className="text-[#F1F0FF]">{PM_LABELS[selected.paymentMethod] ?? selected.paymentMethod}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">Status</p><p className="text-emerald-400">{selected.status}</p></div>
                </div>
                <div className="border-t border-[#2A2A45] pt-4">
                  <p className="text-xs text-[#5C5A7A] mb-3">Items</p>
                  <div className="space-y-2">
                    {selected.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-[#A09EC0]">{item.product.name} × {item.quantity} {item.product.unit}</span>
                        <span className="text-[#F1F0FF]">UGX {item.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[#2A2A45] pt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-[#A09EC0]"><span>Subtotal</span><span>UGX {selected.subtotal.toLocaleString()}</span></div>
                  {selected.discount > 0 && <div className="flex justify-between text-[#A09EC0]"><span>Discount</span><span>-UGX {selected.discount.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-[#F1F0FF] font-bold text-base pt-1"><span>Total</span><span>UGX {selected.total.toLocaleString()}</span></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
