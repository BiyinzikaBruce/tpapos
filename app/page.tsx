import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/dashboard",
  MANAGER: "/manager/dashboard",
  STORE_MANAGER: "/store/inventory",
  CASHIER: "/cashier",
};

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const role = (session.user as { role?: string }).role ?? "";
  redirect(ROLE_HOME[role] ?? "/login");
}
