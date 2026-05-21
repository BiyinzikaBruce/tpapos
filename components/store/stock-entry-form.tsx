"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

type Item = { id: string; name: string; sku?: string | null };

interface Props {
  defaultBranchId: string;
  products: Item[];
  branches: Item[];
  suppliers: Item[];
}

const TYPES = [
  { value: "IN", label: "Stock In", desc: "Receive new stock from a supplier" },
  { value: "OUT", label: "Stock Out", desc: "Remove stock (damage, loss, etc.)" },
  { value: "TRANSFER", label: "Transfer", desc: "Move stock to another branch" },
] as const;

export function StockEntryForm({ defaultBranchId, products, branches, suppliers }: Props) {
  const router = useRouter();
  const [type, setType] = useState<"IN" | "OUT" | "TRANSFER">("IN");
  const [productId, setProductId] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [toBranchId, setToBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !branchId || quantity < 1) return toast.error("Fill in all required fields");
    if (type === "TRANSFER" && !toBranchId) return toast.error("Select a destination branch");

    setIsPending(true);
    try {
      const res = await fetch("/api/stock/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, productId, branchId, toBranchId: toBranchId || undefined, supplierId: supplierId || undefined, quantity, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      toast.success("Stock entry recorded!");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-400 mb-4" />
        <h2 className="text-xl font-bold text-[#F1F0FF] mb-2">Entry Recorded</h2>
        <p className="text-[#A09EC0] text-sm mb-6">Stock levels have been updated.</p>
        <div className="flex gap-3">
          <Button onClick={() => { setDone(false); setProductId(""); setQuantity(1); setNotes(""); }} variant="outline" className="border-[#2A2A45] text-[#A09EC0]">New Entry</Button>
          <Button onClick={() => router.push("/store/inventory")} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">View Inventory</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn("p-3 rounded-xl border text-left transition-all", type === t.value ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-[#2A2A45] bg-[#0D0D1A] hover:border-[#7C3AED]/40")}
          >
            <p className={cn("text-sm font-semibold", type === t.value ? "text-[#A78BFA]" : "text-[#F1F0FF]")}>{t.label}</p>
            <p className="text-[10px] text-[#5C5A7A] mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
        <div>
          <Label className="text-xs text-[#A09EC0] mb-1.5 block">Product *</Label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required className="w-full h-10 rounded-lg border border-[#2A2A45] bg-[#0D0D1A] text-[#F1F0FF] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
            <option value="">Select product...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
          </select>
        </div>

        <div>
          <Label className="text-xs text-[#A09EC0] mb-1.5 block">{type === "TRANSFER" ? "From Branch *" : "Branch *"}</Label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} required className="w-full h-10 rounded-lg border border-[#2A2A45] bg-[#0D0D1A] text-[#F1F0FF] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {type === "TRANSFER" && (
          <div>
            <Label className="text-xs text-[#A09EC0] mb-1.5 block">To Branch *</Label>
            <select value={toBranchId} onChange={(e) => setToBranchId(e.target.value)} className="w-full h-10 rounded-lg border border-[#2A2A45] bg-[#0D0D1A] text-[#F1F0FF] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
              <option value="">Select destination...</option>
              {branches.filter((b) => b.id !== branchId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {type === "IN" && (
          <div>
            <Label className="text-xs text-[#A09EC0] mb-1.5 block">Supplier (optional)</Label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full h-10 rounded-lg border border-[#2A2A45] bg-[#0D0D1A] text-[#F1F0FF] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
              <option value="">No supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <Label className="text-xs text-[#A09EC0] mb-1.5 block">Quantity *</Label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] focus-visible:ring-[#7C3AED]"
          />
        </div>

        <div>
          <Label className="text-xs text-[#A09EC0] mb-1.5 block">Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
            className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] focus-visible:ring-[#7C3AED] resize-none"
            rows={2}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold">
        {isPending ? "Saving..." : `Record ${type === "IN" ? "Stock In" : type === "OUT" ? "Stock Out" : "Transfer"}`}
      </Button>
    </form>
  );
}
