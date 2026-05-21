"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Truck, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export function SuppliersClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState({ name: "", contactName: "", phone: "", email: "", address: "" });

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.contactName ?? "").toLowerCase().includes(search.toLowerCase()));

  function setField(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return toast.error("Supplier name is required");
    setIsPending(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      setSuppliers((p) => [created, ...p].sort((a, b) => a.name.localeCompare(b.name)));
      setOpen(false);
      setForm({ name: "", contactName: "", phone: "", email: "", address: "" });
      toast.success("Supplier added!");
    } catch {
      toast.error("Failed to add supplier");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5C5A7A]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="pl-8 w-56 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] text-sm h-9" />
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Add Supplier
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <Truck className="w-10 h-10 mb-3 opacity-30" />
          <p>No suppliers found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#F1F0FF] truncate">{s.name}</p>
                  {s.contactName && <p className="text-xs text-[#A09EC0]">{s.contactName}</p>}
                  {s.phone && <p className="text-xs text-[#5C5A7A] mt-1">{s.phone}</p>}
                  {s.email && <p className="text-xs text-[#5C5A7A]">{s.email}</p>}
                  {s.address && <p className="text-xs text-[#3A3A60] mt-1 line-clamp-1">{s.address}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">Add Supplier</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "name", label: "Supplier Name *", placeholder: "e.g. Uganda Breweries Ltd" },
              { key: "contactName", label: "Contact Person", placeholder: "e.g. John Mugabi" },
              { key: "phone", label: "Phone", placeholder: "+256 41 320000" },
              { key: "email", label: "Email", placeholder: "sales@supplier.co.ug" },
              { key: "address", label: "Address", placeholder: "Kampala, Uganda" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs text-[#A09EC0] mb-1.5 block">{label}</Label>
                <Input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setField(key as keyof typeof form, e.target.value)}
                  placeholder={placeholder}
                  className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60] focus-visible:ring-[#7C3AED]"
                />
              </div>
            ))}
            <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold mt-2">
              {isPending ? "Saving..." : "Add Supplier"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
