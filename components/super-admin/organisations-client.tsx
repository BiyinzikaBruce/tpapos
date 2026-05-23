"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Plus, Pencil, Search, Users, Package,
  ShoppingCart, GitBranch, UserCog, Trash2, X, Check,
} from "lucide-react";
import { format } from "date-fns";

type Admin = { id: string; name: string; email: string; createdAt: Date | string };

type Org = {
  id: string; name: string; plan: string; lowStockThreshold: number; createdAt: Date | string;
  _count: { branches: number; users: number; products: number; sales: number };
  users: Admin[];
};

export function OrganisationsClient({ initialOrgs }: { initialOrgs: Org[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [search, setSearch] = useState("");

  // Edit org sheet
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Org | null>(null);
  const [editForm, setEditForm] = useState({ name: "", plan: "FREE" });
  const [editPending, setEditPending] = useState(false);

  // Manage admins sheet
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminOrg, setAdminOrg] = useState<Org | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [adminPending, setAdminPending] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [adminEditForm, setAdminEditForm] = useState({ name: "", email: "" });

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  // ── Org CRUD ──────────────────────────────────────────────────────────────
  function openAdd() { setEditing(null); setEditForm({ name: "", plan: "FREE" }); setEditOpen(true); }
  function openEdit(o: Org) { setEditing(o); setEditForm({ name: o.name, plan: o.plan }); setEditOpen(true); }

  async function handleOrgSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name) return toast.error("Organisation name is required");
    setEditPending(true);
    try {
      const res = await fetch(
        editing ? `/api/super-admin/organisations/${editing.id}` : "/api/super-admin/organisations",
        { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) }
      );
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      if (editing) {
        setOrgs((prev) => prev.map((o) => o.id === editing.id ? { ...o, ...saved } : o));
        toast.success("Organisation updated");
      } else {
        setOrgs((prev) => [{ ...saved, _count: { branches: 0, users: 0, products: 0, sales: 0 }, users: [] }, ...prev]);
        toast.success("Organisation created");
      }
      setEditOpen(false);
    } catch {
      toast.error("Failed to save organisation");
    } finally {
      setEditPending(false);
    }
  }

  // ── Admin management ──────────────────────────────────────────────────────
  function openAdmins(o: Org) {
    setAdminOrg(o);
    setAdmins(o.users);
    setAddingAdmin(false);
    setAdminForm({ name: "", email: "", password: "" });
    setEditingAdmin(null);
    setAdminOpen(true);
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email || !adminForm.password) return toast.error("All fields required");
    if (!adminOrg) return;
    setAdminPending(true);
    try {
      const res = await fetch(`/api/super-admin/organisations/${adminOrg.id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAdmins((prev) => [...prev, data]);
      setOrgs((prev) => prev.map((o) => o.id === adminOrg.id
        ? { ...o, users: [...o.users, data], _count: { ...o._count, users: o._count.users + 1 } }
        : o
      ));
      setAdminForm({ name: "", email: "", password: "" });
      setAddingAdmin(false);
      toast.success("Admin created successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setAdminPending(false);
    }
  }

  function startEditAdmin(a: Admin) {
    setEditingAdmin(a);
    setAdminEditForm({ name: a.name, email: a.email });
  }

  async function handleEditAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAdmin || !adminOrg) return;
    setAdminPending(true);
    try {
      const res = await fetch(`/api/super-admin/organisations/${adminOrg.id}/admins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingAdmin.id, ...adminEditForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAdmins((prev) => prev.map((a) => a.id === editingAdmin.id ? data : a));
      setOrgs((prev) => prev.map((o) => o.id === adminOrg.id
        ? { ...o, users: o.users.map((a) => a.id === editingAdmin.id ? data : a) }
        : o
      ));
      setEditingAdmin(null);
      toast.success("Admin updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update admin");
    } finally {
      setAdminPending(false);
    }
  }

  async function handleRemoveAdmin(adminId: string) {
    if (!adminOrg) return;
    if (!confirm("Remove this admin? They will be unlinked from the organisation.")) return;
    try {
      const res = await fetch(`/api/super-admin/organisations/${adminOrg.id}/admins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: adminId }),
      });
      if (!res.ok) throw new Error("Failed");
      setAdmins((prev) => prev.filter((a) => a.id !== adminId));
      setOrgs((prev) => prev.map((o) => o.id === adminOrg.id
        ? { ...o, users: o.users.filter((a) => a.id !== adminId), _count: { ...o._count, users: Math.max(0, o._count.users - 1) } }
        : o
      ));
      toast.success("Admin removed");
    } catch {
      toast.error("Failed to remove admin");
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5C5A7A]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organisations..."
            className="pl-8 w-64 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] text-sm h-9" />
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" />New Organisation
        </Button>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((o) => (
          <div key={o.id} className="rounded-xl border p-5" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
            <div className="flex items-start justify-between mb-3">
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
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

            {/* Admin pill(s) */}
            <div className="flex flex-wrap gap-1.5 items-center mt-2">
              {o.users.length === 0 ? (
                <span className="text-xs text-[#5C5A7A] italic">No admin set</span>
              ) : (
                o.users.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 text-xs bg-[#7C3AED]/10 text-[#A78BFA] border border-[#7C3AED]/20 rounded-full px-2 py-0.5">
                    <UserCog className="w-3 h-3" />{a.name}
                  </span>
                ))
              )}
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-[#5C5A7A] hover:text-[#A78BFA] ml-auto" onClick={() => openAdmins(o)}>
                <UserCog className="w-3 h-3 mr-1" />Manage Admins
              </Button>
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

      {/* ── Edit Org Sheet ── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">{editing ? "Edit Organisation" : "New Organisation"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Organisation Name *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Kampala General Store"
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Plan</Label>
              <select value={editForm.plan} onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
              </select>
            </div>
            <Button type="submit" disabled={editPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold mt-2">
              {editPending ? "Saving..." : editing ? "Save Changes" : "Create Organisation"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Manage Admins Sheet ── */}
      <Sheet open={adminOpen} onOpenChange={setAdminOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-[#F1F0FF]">Manage Admins</SheetTitle>
            {adminOrg && <p className="text-xs text-[#5C5A7A]">{adminOrg.name}</p>}
          </SheetHeader>

          {/* Existing admins */}
          <div className="space-y-2 mb-4">
            {admins.length === 0 && (
              <p className="text-sm text-[#5C5A7A] py-4 text-center">No admins yet</p>
            )}
            {admins.map((a) => (
              <div key={a.id}>
                {editingAdmin?.id === a.id ? (
                  <form onSubmit={handleEditAdmin} className="rounded-lg border border-[#7C3AED]/30 bg-[#12122A] p-3 space-y-2">
                    <Input value={adminEditForm.name} onChange={(e) => setAdminEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Name" className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] h-8 text-sm" />
                    <Input value={adminEditForm.email} onChange={(e) => setAdminEditForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Email" className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] h-8 text-sm" />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={adminPending} className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-8 text-xs">
                        <Check className="w-3 h-3 mr-1" />{adminPending ? "Saving..." : "Save"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="h-8 text-[#5C5A7A]" onClick={() => setEditingAdmin(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-[#2A2A45] bg-[#12122A] px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#A78BFA] text-xs font-bold flex-shrink-0">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F1F0FF] truncate">{a.name}</p>
                      <p className="text-xs text-[#5C5A7A] truncate">{a.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-[#F1F0FF]" onClick={() => startEditAdmin(a)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-red-400" onClick={() => handleRemoveAdmin(a.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="bg-[#2A2A45] mb-4" />

          {/* Add admin form */}
          {addingAdmin ? (
            <form onSubmit={handleAddAdmin} className="space-y-3">
              <p className="text-xs font-semibold text-[#A09EC0] uppercase tracking-wide">New Admin</p>
              <div>
                <Label className="text-xs text-[#A09EC0] mb-1 block">Full Name *</Label>
                <Input value={adminForm.name} onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Patricia Nansubuga"
                  className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
              </div>
              <div>
                <Label className="text-xs text-[#A09EC0] mb-1 block">Email *</Label>
                <Input type="email" value={adminForm.email} onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@company.com"
                  className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
              </div>
              <div>
                <Label className="text-xs text-[#A09EC0] mb-1 block">Temporary Password *</Label>
                <Input type="password" value={adminForm.password} onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={adminPending} className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-10 font-semibold">
                  {adminPending ? "Creating..." : "Create Admin"}
                </Button>
                <Button type="button" variant="outline" className="border-[#2A2A45] text-[#A09EC0] hover:text-[#F1F0FF]" onClick={() => setAddingAdmin(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setAddingAdmin(true)} className="w-full bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/20 h-10">
              <Plus className="w-4 h-4 mr-2" />Add Admin
            </Button>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
