"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search } from "lucide-react";
import { format } from "date-fns";

type Branch = { id: string; name: string };
type User = { id: string; name: string; email: string; role: string; branchId: string | null; createdAt: Date | string; branch: { name: string } | null };

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  MANAGER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  STORE_MANAGER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CASHIER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const ROLES = ["ADMIN", "MANAGER", "STORE_MANAGER", "CASHIER"];

export function UsersClient({ initialUsers, branches }: { initialUsers: User[]; branches: Branch[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CASHIER", branchId: "" });

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  function setField(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) return toast.error("All fields required");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setIsPending(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      const created = await res.json();
      const branch = branches.find((b) => b.id === created.branchId);
      setUsers((prev) => [{ ...created, branch: branch ? { name: branch.name } : null }, ...prev]);
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "CASHIER", branchId: "" });
      toast.success("User added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5C5A7A]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="pl-8 w-56 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] text-sm h-9" />
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="ml-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Add User
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#2A2A45" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#12122A] border-b border-[#2A2A45]">
              {["Name", "Email", "Role", "Branch", "Joined"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[#5C5A7A] font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-[#5C5A7A]"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No users found</p></td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="border-b border-[#1E1E35] hover:bg-[#12122A] transition-colors">
                <td className="px-4 py-3 font-medium text-[#F1F0FF]">{u.name}</td>
                <td className="px-4 py-3 text-[#A09EC0]">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge className={ROLE_COLORS[u.role] ?? ""}>{u.role.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 text-[#5C5A7A]">{u.branch?.name ?? "—"}</td>
                <td className="px-4 py-3 text-[#5C5A7A]">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">Add Staff Member</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {([
              { key: "name" as const, label: "Full Name *", placeholder: "e.g. Sarah Nakato" },
              { key: "email" as const, label: "Email *", placeholder: "sarah@yourcompany.com" },
              { key: "password" as const, label: "Password *", placeholder: "Min. 8 characters" },
            ]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs text-[#A09EC0] mb-1.5 block">{label}</Label>
                <Input
                  type={key === "password" ? "password" : "text"}
                  value={form[key]} onChange={(e) => setField(key, e.target.value)}
                  placeholder={placeholder}
                  className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]"
                />
              </div>
            ))}
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Role *</Label>
              <select value={form.role} onChange={(e) => setField("role", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Branch</Label>
              <select value={form.branchId} onChange={(e) => setField("branchId", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
                <option value="">No branch assigned</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold mt-2">
              {isPending ? "Adding..." : "Add User"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
