"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatUGX } from "@/lib/format";
import { ShoppingCart, Calendar, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SaleItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: { id: string; name: string; unit: string };
};

type Sale = {
  id: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  cashier: { id: string; name: string };
  items: SaleItem[];
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MTN_MOMO: "MTN MoMo",
  AIRTEL_MONEY: "Airtel Money",
};

const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MTN_MOMO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  AIRTEL_MONEY: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface HistoryClientProps {
  branchId: string;
  cashierName: string;
}

export function HistoryClient({ branchId }: HistoryClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [voiding, setVoiding] = useState(false);
  const queryClient = useQueryClient();

  async function handleVoid(saleId: string) {
    if (!confirm("Void this sale? Stock will be restored.")) return;
    setVoiding(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VOID" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to void");
      }
      toast.success("Sale voided and stock restored");
      setSelectedSale((prev) => prev ? { ...prev, status: "VOIDED" } : null);
      queryClient.invalidateQueries({ queryKey: ["sales", branchId, selectedDate] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to void sale");
    } finally {
      setVoiding(false);
    }
  }

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales", branchId, selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/sales?branchId=${branchId}&date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to load sales");
      return res.json();
    },
    enabled: !!branchId,
  });

  const totalRevenue = sales.filter((s) => s.status === "COMPLETED").reduce((sum, s) => sum + s.total, 0);

  return (
    <>
      {/* Date picker + summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#7C3AED]" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] focus-visible:ring-[#7C3AED]"
          />
        </div>
        {!isLoading && (
          <div className="flex gap-4 text-sm">
            <span className="text-[#A09EC0]">
              <span className="font-semibold text-[#F1F0FF]">{sales.length}</span> sales
            </span>
            <span className="text-[#A09EC0]">
              <span className="font-semibold text-[#7C3AED]">{formatUGX(totalRevenue)}</span> total
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
          <p>No sales recorded for this date</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border-subtle)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-[#5C5A7A] uppercase tracking-wide" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, idx) => (
                <tr
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-[#12122A]",
                    idx !== sales.length - 1 && "border-b"
                  )}
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <td className="px-4 py-3 text-[#A09EC0]">
                    {format(new Date(sale.createdAt), "HH:mm")}
                  </td>
                  <td className="px-4 py-3 text-[#F1F0FF]">{sale.items.length} item{sale.items.length !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border", METHOD_COLORS[sale.paymentMethod])}>
                      {METHOD_LABELS[sale.paymentMethod]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#7C3AED]">{formatUGX(sale.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border", sale.status === "VOIDED" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30")}>
                      {sale.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sale Detail Sheet */}
      <Sheet open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          {selectedSale && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#F1F0FF]">Sale Details</SheetTitle>
                <p className="text-xs text-[#5C5A7A]">{format(new Date(selectedSale.createdAt), "PPpp")}</p>
              </SheetHeader>

              <div className="flex gap-2 mb-4">
                <Badge className={cn("text-xs border", METHOD_COLORS[selectedSale.paymentMethod])}>
                  {METHOD_LABELS[selectedSale.paymentMethod]}
                </Badge>
                <Badge className={cn("text-xs border", selectedSale.status === "VOIDED" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30")}>
                  {selectedSale.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-2 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
                    <div>
                      <p className="text-[#F1F0FF]">{item.product.name}</p>
                      <p className="text-xs text-[#5C5A7A]">{item.quantity} × {formatUGX(item.unitPrice)}</p>
                    </div>
                    <span className="font-medium text-[#F1F0FF]">{formatUGX(item.total)}</span>
                  </div>
                ))}
              </div>

              <Separator className="bg-[#2A2A45] mb-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#A09EC0]">
                  <span>Subtotal</span>
                  <span>{formatUGX(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-[#A09EC0]">
                    <span>Discount</span>
                    <span>− {formatUGX(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span className="text-[#F1F0FF]">Total</span>
                  <span className="text-[#7C3AED]">{formatUGX(selectedSale.total)}</span>
                </div>
              </div>

              {selectedSale.status === "COMPLETED" && (
                <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVoid(selectedSale.id)}
                    disabled={voiding}
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                  >
                    <Ban className="w-3.5 h-3.5 mr-2" />
                    {voiding ? "Voiding..." : "Void Sale"}
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
