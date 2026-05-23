"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import type { NavItem } from "./nav-config";
import {
  LayoutDashboard, Building2, Users, Package, Warehouse, ShoppingCart,
  BarChart3, FileText, MessageCircle, Bell, Settings, Truck,
  ArrowLeftRight, Download, Monitor, Shield, LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Building2, Users, Package, Warehouse, ShoppingCart,
  BarChart3, FileText, MessageCircle, Bell, Settings, Truck,
  ArrowLeftRight, Download, Monitor, Shield,
};

interface SidebarProps {
  navItems: NavItem[];
  orgName?: string;
  orgLogoUrl?: string;
  userName?: string;
  userRole?: string;
}

export function Sidebar({
  navItems,
  orgName = "TPAPOS",
  orgLogoUrl,
  userName,
  userRole,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-50 border-r"
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "var(--color-bg-base)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      {/* Org logo + name */}
      <div className="flex flex-col items-center gap-2 px-4 py-5 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
        {orgLogoUrl ? (
          <>
            <img
              src={orgLogoUrl}
              alt={orgName}
              className="w-full max-h-20 object-contain rounded-xl"
            />
            <span className="text-[0.75rem] font-medium text-[#5C5A7A] truncate text-center">{orgName}</span>
          </>
        ) : (
          <>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {orgName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[0.85rem] font-semibold text-[#F1F0FF] truncate text-center">{orgName}</span>
          </>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Package;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-[#A09EC0] hover:text-[#F1F0FF] hover:bg-[#18182C]"
              )}
              style={
                isActive
                  ? {
                      backgroundColor: "var(--color-primary)",
                      boxShadow: "inset 0 0 12px rgba(124,58,237,0.15)",
                    }
                  : {}
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 pt-3 border-t space-y-1" style={{ borderColor: "var(--color-border-subtle)" }}>
        {userName && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary-muted)" }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F1F0FF] truncate">{userName}</p>
              {userRole && (
                <p className="text-xs text-[#5C5A7A] truncate capitalize">
                  {userRole.toLowerCase().replace("_", " ")}
                </p>
              )}
            </div>
          </div>
        )}
        <LogoutButton variant="ghost" size="sm" showIcon className="w-full justify-start text-[#A09EC0] hover:text-[#F43F5E]" />
      </div>
    </aside>
  );
}
