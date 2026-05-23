"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tag, Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; _count: { products: number } };

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setName(""); setOpen(true); }
  function openEdit(c: Category) { setEditing(c); setName(c.name); setOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Category name is required");
    setIsPending(true);
    try {
      const res = await fetch(editing ? `/api/categories/${editing.id}` : "/api/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }

      if (editing) {
        setCategories((prev) => prev.map((c) => c.id === editing.id ? data : c).sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Category updated");
      } else {
        setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Category created");
      }
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(c: Category) {
    if (c._count.products > 0) {
      toast.error(`Cannot delete — ${c._count.products} product(s) use this category`);
      return;
    }
    if (!confirm(`Delete "${c.name}"?`)) return;
    const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Failed to delete"); return; }
    setCategories((prev) => prev.filter((x) => x.id !== c.id));
    toast.success("Category deleted");
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5C5A7A]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="pl-8 w-56 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] text-sm h-9"
          />
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" />New Category
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 mb-4 text-sm text-[#5C5A7A]">
        <Tag className="w-3.5 h-3.5" />
        <span><span className="text-[#F1F0FF] font-medium">{categories.length}</span> categor{categories.length === 1 ? "y" : "ies"}</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <Tag className="w-10 h-10 mb-3 opacity-30" />
          <p className="mb-4">{search ? "No categories match your search" : "No categories yet"}</p>
          {!search && (
            <Button onClick={openAdd} size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Add your first category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="group flex items-center justify-between rounded-xl border px-4 py-3.5 transition-colors hover:border-[#3A3A60]"
              style={{ borderColor: "#2A2A45", background: "#12122A" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/15 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#F1F0FF] truncate">{c.name}</p>
                  <p className="text-xs text-[#5C5A7A] flex items-center gap-1 mt-0.5">
                    <Package className="w-3 h-3" />
                    {c._count.products} product{c._count.products !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                <Button
                  size="sm" variant="ghost"
                  className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-[#F1F0FF]"
                  onClick={() => openEdit(c)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className={cn("h-7 w-7 p-0", c._count.products > 0 ? "text-[#3A3A60] cursor-not-allowed" : "text-[#5C5A7A] hover:text-red-400")}
                  onClick={() => handleDelete(c)}
                  title={c._count.products > 0 ? "Cannot delete — has products" : "Delete category"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-sm">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-[#F1F0FF]">{editing ? "Rename Category" : "New Category"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#A09EC0] mb-1.5 block">Category Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics, Beverages, Clothing"
                autoFocus
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold">
              {isPending ? "Saving..." : editing ? "Save Changes" : "Create Category"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
