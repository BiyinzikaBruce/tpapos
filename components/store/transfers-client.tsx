"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";

type Transfer = {
  id: string;
  quantity: number;
  notes: string | null;
  status: string;
  createdAt: string;
  product: { name: string; sku: string | null };
  fromBranch: string;
  toBranch: string;
  requestedBy: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function TransfersClient({ transfers }: { transfers: Transfer[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(id: string, action: "APPROVE" | "REJECT") {
    setLoading(id + action);
    try {
      const res = await fetch(`/api/stock/transfers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(action === "APPROVE" ? "Transfer approved — stock updated" : "Transfer rejected");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(null);
    }
  }

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
        <ArrowLeftRight className="w-10 h-10 mb-3 opacity-30" />
        <p>No transfers yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border-subtle)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-[#5C5A7A] uppercase tracking-wide" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">From → To</th>
            <th className="px-4 py-3">Requested By</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((t, i) => (
            <tr key={t.id} className={cn("transition-colors hover:bg-[#12122A]", i !== transfers.length - 1 && "border-b")} style={{ borderColor: "var(--color-border-subtle)" }}>
              <td className="px-4 py-3 text-[#5C5A7A]">{format(new Date(t.createdAt), "MMM d, HH:mm")}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-[#F1F0FF]">{t.product.name}</p>
                {t.product.sku && <p className="text-[10px] text-[#5C5A7A] font-mono">{t.product.sku}</p>}
              </td>
              <td className="px-4 py-3 font-bold text-[#F1F0FF]">{t.quantity}</td>
              <td className="px-4 py-3 text-[#A09EC0] text-xs">{t.fromBranch} → {t.toBranch}</td>
              <td className="px-4 py-3 text-[#A09EC0]">{t.requestedBy}</td>
              <td className="px-4 py-3">
                <Badge className={cn("text-xs border", STATUS_STYLES[t.status])}>{t.status}</Badge>
              </td>
              <td className="px-4 py-3">
                {t.status === "PENDING" && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleAction(t.id, "APPROVE")}
                      disabled={loading === t.id + "APPROVE"}
                      className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {loading === t.id + "APPROVE" ? "..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(t.id, "REJECT")}
                      disabled={loading === t.id + "REJECT"}
                      className="h-7 px-3 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                    >
                      {loading === t.id + "REJECT" ? "..." : "Reject"}
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
