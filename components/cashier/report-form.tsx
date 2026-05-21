"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUGX } from "@/lib/format";
import { CheckCircle, FileText } from "lucide-react";

type Sale = {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
};

interface ReportFormProps {
  branchId: string;
  cashierId: string;
  organisationId: string;
}

export function ReportForm({ branchId }: ReportFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales", branchId, today],
    queryFn: async () => {
      const res = await fetch(`/api/sales?branchId=${branchId}&date=${today}`);
      if (!res.ok) throw new Error("Failed to load sales");
      return res.json();
    },
    enabled: !!branchId,
  });

  const completedSales = sales.filter((s) => s.status === "COMPLETED");
  const totalSales = completedSales.reduce((s, sale) => s + sale.total, 0);
  const cashAmount = completedSales.filter((s) => s.paymentMethod === "CASH").reduce((s, sale) => s + sale.total, 0);
  const momoAmount = completedSales.filter((s) => s.paymentMethod !== "CASH").reduce((s, sale) => s + sale.total, 0);
  const salesCount = completedSales.length;

  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, date: today, totalSales, cashAmount, momoAmount, salesCount, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to submit");
      }
      setSubmitted(true);
      toast.success("Report submitted! Admin has been notified.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-400 mb-4" />
        <h2 className="text-xl font-bold text-[#F1F0FF] mb-2">Report Submitted</h2>
        <p className="text-[#A09EC0] text-sm">Your daily report has been sent to the admin.</p>
        <p className="text-2xl font-bold text-[#7C3AED] mt-4">{formatUGX(totalSales)}</p>
        <p className="text-xs text-[#5C5A7A] mt-1">{salesCount} sale{salesCount !== 1 ? "s" : ""} today</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Sales", value: formatUGX(totalSales), accent: true },
          { label: "Sales Count", value: String(salesCount) },
          { label: "Cash", value: formatUGX(cashAmount) },
          { label: "Mobile Money", value: formatUGX(momoAmount) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
            <p className="text-xs text-[#5C5A7A] mb-1">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.accent ? "text-[#7C3AED]" : "text-[#F1F0FF]"}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
        <div>
          <Label className="text-xs text-[#A09EC0] mb-1.5 block">Date</Label>
          <Input value={today} readOnly className="bg-[#0D0D1A] border-[#2A2A45] text-[#5C5A7A]" />
        </div>
        <div>
          <Label className="text-xs text-[#A09EC0] mb-1.5 block">Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes for the admin..."
            className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] focus-visible:ring-[#7C3AED] resize-none"
            rows={3}
          />
        </div>
      </div>

      {salesCount === 0 && (
        <p className="text-xs text-[#A09EC0] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          No sales recorded today. You can still submit a zero report.
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-11"
      >
        {isPending ? "Submitting..." : "Submit Daily Report"}
      </Button>
    </form>
  );
}
