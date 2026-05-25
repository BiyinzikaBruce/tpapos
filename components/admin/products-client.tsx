"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

type Category = { id: string; name: string };
type Product = {
  id: string; name: string; sku: string | null; price: number; costPrice: number | null;
  unit: string; isActive: boolean; categoryId: string; stock?: number;
  category: { id: string; name: string };
};

type FormState = { name: string; sku: string; price: string; costPrice: string; unit: string; categoryId: string; initialStock: string };

const EMPTY: FormState = { name: "", sku: "", price: "", costPrice: "", unit: "pcs", categoryId: "", initialStock: "0" };

export function ProductsClient({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isPending, setIsPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.categoryId === catFilter;
    return matchSearch && matchCat;
  });

  function openAdd() { setEditing(null); setDeleteConfirm(false); setForm(EMPTY); setOpen(true); }
  function openEdit(p: Product) {
    setEditing(p);
    setDeleteConfirm(false);
    setForm({ name: p.name, sku: p.sku ?? "", price: String(p.price), costPrice: p.costPrice ? String(p.costPrice) : "", unit: p.unit, categoryId: p.categoryId, initialStock: String(p.stock ?? 0) });
    setOpen(true);
  }
  function setField(k: keyof FormState, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) return toast.error("Name, price and category are required");
    setIsPending(true);
    try {
      const body: Record<string, unknown> = { name: form.name, sku: form.sku || null, price: parseFloat(form.price), costPrice: form.costPrice ? parseFloat(form.costPrice) : null, unit: form.unit, categoryId: form.categoryId };
      const stockVal = parseInt(form.initialStock);
      const validStock = !isNaN(stockVal) && stockVal >= 0 ? stockVal : 0;
      if (!editing) body.initialStock = validStock;
      else body.stockQty = validStock;
      const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      const withCategory = { ...saved, price: Number(saved.price), costPrice: saved.costPrice ? Number(saved.costPrice) : null, stock: saved.stock ?? 0, category: categories.find((c) => c.id === saved.categoryId) ?? { id: saved.categoryId, name: "" } };
      if (editing) {
        setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...withCategory } : p));
        toast.success("Product updated");
      } else {
        setProducts((prev) => [...prev, withCategory].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Product added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save product");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${editing.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setProducts((prev) => prev.filter((p) => p.id !== editing.id));
      setOpen(false);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  }

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
      toast.success(p.isActive ? "Product deactivated" : "Product activated");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5C5A7A]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-8 w-56 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] text-sm h-9" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button onClick={openAdd} size="sm" className="ml-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Add Product
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#2A2A45" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#12122A] border-b border-[#2A2A45]">
              {["Product", "SKU", "Category", "Price", "Cost", "Unit", "Stock", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[#5C5A7A] font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-[#5C5A7A]"><Package className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No products found</p></td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-b border-[#1E1E35] hover:bg-[#12122A] transition-colors">
                <td className="px-4 py-3 font-medium text-[#F1F0FF]">{p.name}</td>
                <td className="px-4 py-3 text-[#5C5A7A]">{p.sku ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="border-[#2A2A45] text-[#A09EC0] text-xs">{p.category.name}</Badge></td>
                <td className="px-4 py-3 text-[#F1F0FF]">UGX {p.price.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#5C5A7A]">{p.costPrice ? `UGX ${p.costPrice.toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3 text-[#5C5A7A]">{p.unit}</td>
                <td className="px-4 py-3">
                  <span className={(p.stock ?? 0) === 0 ? "text-red-400" : (p.stock ?? 0) <= 5 ? "text-amber-400" : "text-emerald-400"}>
                    {p.stock ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge className={p.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-[#F1F0FF]" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-[#F1F0FF]" onClick={() => toggleActive(p)}>
                      {p.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDeleteConfirm(false); }}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">{editing ? "Edit Product" : "Add Product"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {([
              { key: "name", label: "Product Name *", placeholder: "e.g. Nile Special 500ml" },
              { key: "sku", label: "SKU", placeholder: "e.g. NS-500" },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs text-[#A09EC0] mb-1.5 block">{label}</Label>
                <Input value={form[key]} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
              </div>
            ))}
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Category *</Label>
              <select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#A09EC0] mb-1.5 block">Selling Price (UGX) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="5000" className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF]" />
              </div>
              <div>
                <Label className="text-xs text-[#A09EC0] mb-1.5 block">Cost Price (UGX)</Label>
                <Input type="number" value={form.costPrice} onChange={(e) => setField("costPrice", e.target.value)} placeholder="3500" className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF]" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Unit</Label>
              <select value={form.unit} onChange={(e) => setField("unit", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
                {["pcs", "bottles", "boxes", "kg", "litres", "crates", "packets"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">{editing ? "Stock Quantity" : "Initial Stock Quantity"}</Label>
              <Input
                type="number"
                min="0"
                value={form.initialStock}
                onChange={(e) => setField("initialStock", e.target.value)}
                placeholder="0"
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF]"
              />
              <p className="text-xs text-[#5C5A7A] mt-1">{editing ? "Updates stock across all branches" : "Stock will be set for all branches in your organisation"}</p>
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold mt-2">
              {isPending ? "Saving..." : editing ? "Save Changes" : "Add Product"}
            </Button>
            {editing && (
              <div className="pt-3 border-t border-[#2A2A45]">
                {!deleteConfirm ? (
                  <Button type="button" variant="ghost" onClick={() => setDeleteConfirm(true)} className="w-full h-10 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20">
                    <Trash2 className="w-4 h-4 mr-2" />Delete Product
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-[#A09EC0]">Are you sure? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => setDeleteConfirm(false)} className="flex-1 h-9 border border-[#2A2A45] text-[#A09EC0] hover:text-[#F1F0FF]">Cancel</Button>
                      <Button type="button" onClick={handleDelete} disabled={isDeleting} className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white">
                        {isDeleting ? "Deleting..." : "Yes, Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
