import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/reset-password"];

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/dashboard",
  MANAGER: "/manager/dashboard",
  CASHIER: "/cashier",
  STORE_MANAGER: "/store/inventory",
};

const ROLE_PREFIXES: Record<string, string[]> = {
  SUPER_ADMIN: ["/super-admin"],
  ADMIN: ["/dashboard"],
  MANAGER: ["/manager"],
  CASHIER: ["/cashier"],
  STORE_MANAGER: ["/store"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  if (isPublic) return NextResponse.next();

  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as { role?: string }).role ?? "";
  const allowed = ROLE_PREFIXES[role] ?? [];
  const isAllowed = allowed.some((prefix) => pathname.startsWith(prefix));

  if (!isAllowed) {
    const home = ROLE_HOME[role] ?? "/login";
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
