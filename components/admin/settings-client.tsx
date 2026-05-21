"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Shield, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Org = { id: string; name: string; plan: string; lowStockThreshold: number; logoUrl: string | null };
type User = { id: string; name: string; email: string };

export function SettingsClient({ org, user }: { org: Org; user: User }) {
  const [orgName, setOrgName] = useState(org.name);
  const [threshold, setThreshold] = useState(String(org.lowStockThreshold));
  const [savingOrg, setSavingOrg] = useState(false);

  async function saveOrgSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingOrg(true);
    try {
      const res = await fetch(`/api/organisations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, lowStockThreshold: parseInt(threshold) }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingOrg(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Organisation settings */}
      <div className="rounded-xl border p-6" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F1F0FF]">Organisation</h3>
            <p className="text-xs text-[#5C5A7A]">Business profile settings</p>
          </div>
        </div>
        <form onSubmit={saveOrgSettings} className="space-y-4">
          <div>
            <Label className="text-xs text-[#A09EC0] mb-1.5 block">Organisation Name</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF]" />
          </div>
          <div>
            <Label className="text-xs text-[#A09EC0] mb-1.5 block">Plan</Label>
            <div className="flex items-center gap-2">
              <Badge className={org.plan === "PRO" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-[#2A2A45] text-[#5C5A7A]"}>{org.plan}</Badge>
              {org.plan === "FREE" && <span className="text-xs text-[#5C5A7A]">Upgrade to PRO for advanced features</span>}
            </div>
          </div>
          <Button type="submit" disabled={savingOrg} size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
            {savingOrg ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>

      {/* Inventory settings */}
      <div className="rounded-xl border p-6" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F1F0FF]">Inventory Alerts</h3>
            <p className="text-xs text-[#5C5A7A]">Configure low stock notifications</p>
          </div>
        </div>
        <form onSubmit={saveOrgSettings} className="space-y-4">
          <div>
            <Label className="text-xs text-[#A09EC0] mb-1.5 block">Low Stock Threshold</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number" min="1" value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-32"
              />
              <span className="text-sm text-[#5C5A7A]">units — alert when stock falls below this</span>
            </div>
          </div>
          <Button type="submit" disabled={savingOrg} size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
            {savingOrg ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>

      {/* Account info */}
      <div className="rounded-xl border p-6" style={{ borderColor: "#2A2A45", background: "#12122A" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F1F0FF]">Account</h3>
            <p className="text-xs text-[#5C5A7A]">Your login details</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-[#1E1E35]">
            <span className="text-[#5C5A7A]">Name</span>
            <span className="text-[#F1F0FF]">{user.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#1E1E35]">
            <span className="text-[#5C5A7A]">Email</span>
            <span className="text-[#F1F0FF]">{user.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#5C5A7A]">Role</span>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">ADMIN</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
