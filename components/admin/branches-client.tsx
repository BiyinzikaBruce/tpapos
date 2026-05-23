"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, Plus, Pencil, Users, ShoppingCart, MapPin, Phone, Lock, Zap } from "lucide-react";

type Branch = { id: string; name: string; location: string | null; phone: string | null; createdAt: Date | string; _count: { users: number; sales: number } };
type FormState = { name: string; location: string; phone: string };
const EMPTY: FormState = { name: "", location: "", phone: "" };

interface BranchesClientProps {
  initialBranches: Branch[];
  plan: "FREE" | "PRO";
}

export function BranchesClient({ initialBranches, plan }: BranchesClientProps) {
  const [branches, setBranches] = useState(initialBranches);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isPending, setIsPending] = useState(false);

  const atFreeLimit = plan === "FREE" && branches.length >= 1;

  function openAdd() {
    if (atFreeLimit) return;
    setEditing(null); setForm(EMPTY); setOpen(true);
  }
  function openEdit(b: Branch) { setEditing(b); setForm({ name: b.name, location: b.location ?? "", phone: b.phone ?? "" }); setOpen(true); }
  function setField(k: keyof FormState, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return toast.error("Branch name is required");
    setIsPending(true);
    try {
      const res = await fetch(editing ? `/api/branches/${editing.id}` : "/api/branches", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") toast.error(data.error, { duration: 5000 });
        else toast.error("Failed to save branch");
        return;
      }
      if (editing) {
        setBranches((prev) => prev.map((b) => b.id === editing.id ? { ...b, ...data } : b));
        toast.success("Branch updated");
      } else {
        setBranches((prev) => [...prev, { ...data, _count: { users: 0, sales: 0 } }]);
        toast.success("Branch added");
      }
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        {/* Plan badge */}
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
          plan === "PRO"
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : "bg-[#2A2A45] text-[#5C5A7A] border-[#3A3A60]"
        }`}>
          {plan === "PRO" ? <Zap className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {plan === "PRO" ? "PRO — Unlimited branches" : "FREE — 1 branch limit"}
        </div>

        <Button
          onClick={openAdd}
          size="sm"
          disabled={atFreeLimit}
          title={atFreeLimit ? "Upgrade to PRO for unlimited branches" : undefined}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />Add Branch
        </Button>
      </div>

      {/* FREE limit banner */}
      {atFreeLimit && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Branch limit reached</p>
            <p className="text-xs text-[#A09EC0] mt-0.5">You&apos;re on the FREE plan (1 branch). Ask your super admin to upgrade to PRO for unlimited branches.</p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-[#F1F0FF]" onClick={() => openEdit(b)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
            <h3 className="font-semibold text-[#F1F0FF] mb-1">{b.name}</h3>
            {b.location && <p className="text-xs text-[#5C5A7A] flex items-center gap-1 mb-0.5"><MapPin className="w-3 h-3" />{b.location}</p>}
            {b.phone && <p className="text-xs text-[#5C5A7A] flex items-center gap-1 mb-3"><Phone className="w-3 h-3" />{b.phone}</p>}
            <div className="flex gap-4 pt-3 border-t border-[#2A2A45]">
              <div className="flex items-center gap-1.5 text-xs text-[#A09EC0]">
                <Users className="w-3.5 h-3.5" />{b._count.users} staff
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#A09EC0]">
                <ShoppingCart className="w-3.5 h-3.5" />{b._count.sales} sales
              </div>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
            <Building2 className="w-10 h-10 mb-3 opacity-30" />
            <p>No branches yet</p>
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">{editing ? "Edit Branch" : "Add Branch"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {([
              { key: "name" as const, label: "Branch Name *", placeholder: "e.g. Kampala Central" },
              { key: "location" as const, label: "Location", placeholder: "e.g. Kampala Road, Kampala" },
              { key: "phone" as const, label: "Phone", placeholder: "+256 41 320000" },
            ]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs text-[#A09EC0] mb-1.5 block">{label}</Label>
                <Input value={form[key]} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder}
                  className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
              </div>
            ))}
            <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold mt-2">
              {isPending ? "Saving..." : editing ? "Save Changes" : "Add Branch"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
