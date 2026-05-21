"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Pencil, Search, Users, Package, ShoppingCart, GitBranch } from "lucide-react";
import { format } from "date-fns";

type Org = {
  id: string; name: string; plan: string; lowStockThreshold: number; createdAt: Date | string;
  _count: { branches: number; users: number; products: number; sales: number };
};

export function OrganisationsClient({ initialOrgs }: { initialOrgs: Org[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Org | null>(null);
  const [form, setForm] = useState({ name: "", plan: "FREE" });
  const [isPending, setIsPending] = useState(false);

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setForm({ name: "", plan: "FREE" }); setOpen(true); }
  function openEdit(o: Org) { setEditing(o); setForm({ name: o.name, plan: o.plan }); setOpen(true); }
  function setField(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return toast.error("Organisation name is required");
    setIsPending(true);
    try {
      const res = await fetch(editing ? `/api/super-admin/organisations/${editing.id}` : "/api/super-admin/organisations", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      if (editing) {
        setOrgs((prev) => prev.map((o) => o.id === editing.id ? { ...o, ...saved } : o));
        toast.success("Organisation updated");
      } else {
        setOrgs((prev) => [{ ...saved, _count: { branches: 0, users: 0, products: 0, sales: 0 } }, ...prev]);
        toast.success("Organisation created");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save organisation");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5C5A7A]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organisations..." className="pl-8 w-64 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] text-sm h-9" />
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" />New Organisation
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((o) => (
          <div key={o.id} className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-bold">
                  {o.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-[#F1F0FF]">{o.name}</p>
                  <p className="text-xs text-[#5C5A7A]">Since {format(new Date(o.createdAt), "MMM yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge className={o.plan === "PRO" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-[#2A2A45] text-[#5C5A7A] border-[#3A3A60]"}>{o.plan}</Badge>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-[#F1F0FF]" onClick={() => openEdit(o)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: GitBranch, label: o._count.branches, text: "branches" },
                { icon: Users, label: o._count.users, text: "users" },
                { icon: Package, label: o._count.products, text: "products" },
                { icon: ShoppingCart, label: o._count.sales, text: "sales" },
              ].map(({ icon: Icon, label, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-[#5C5A7A]">
                  <Icon className="w-3.5 h-3.5" />{label.toLocaleString()} {text}
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
            <Building2 className="w-10 h-10 mb-3 opacity-30" />
            <p>No organisations found</p>
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">{editing ? "Edit Organisation" : "New Organisation"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Organisation Name *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Kampala General Store" className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Plan</Label>
              <select value={form.plan} onChange={(e) => setField("plan", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
              </select>
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold mt-2">
              {isPending ? "Saving..." : editing ? "Save Changes" : "Create Organisation"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
