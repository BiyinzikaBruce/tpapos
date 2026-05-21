import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Warehouse,
  ShoppingCart,
  BarChart3,
  FileText,
  MessageCircle,
  Bell,
  Settings,
  Truck,
  ArrowLeftRight,
  Download,
  Monitor,
  Shield,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

export const superAdminNav: NavItem[] = [
  { label: "Platform", href: "/super-admin", icon: Shield },
  { label: "Organisations", href: "/super-admin/organisations", icon: Building2 },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Branches", href: "/dashboard/branches", icon: Building2 },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { label: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Messages", href: "/dashboard/messages", icon: MessageCircle },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const managerNav: NavItem[] = [
  { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Sales", href: "/manager/sales", icon: ShoppingCart },
  { label: "Analytics", href: "/manager/analytics", icon: BarChart3 },
  { label: "Reports", href: "/manager/reports", icon: FileText },
  { label: "Messages", href: "/manager/messages", icon: MessageCircle },
];

export const storeManagerNav: NavItem[] = [
  { label: "Inventory", href: "/store/inventory", icon: Warehouse },
  { label: "Stock Entry", href: "/store/inventory/entry", icon: Package },
  { label: "Transfers", href: "/store/inventory/transfers", icon: ArrowLeftRight },
  { label: "Suppliers", href: "/store/suppliers", icon: Truck },
  { label: "Export", href: "/store/export", icon: Download },
];

export const cashierNav: NavItem[] = [
  { label: "POS", href: "/cashier", icon: Monitor },
  { label: "History", href: "/cashier/history", icon: ShoppingCart },
  { label: "Daily Report", href: "/cashier/report", icon: FileText },
  { label: "Messages", href: "/cashier/messages", icon: MessageCircle },
];
