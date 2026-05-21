import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getSessionOrRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.BETTER_AUTH_URL));
  }
  return session;
}

export function requireRole(
  session: { user: { role?: string | null } },
  ...roles: string[]
) {
  if (!session.user.role || !roles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function requireSameOrg(
  session: { user: { organisationId?: string | null } },
  organisationId: string
) {
  if (session.user.organisationId !== organisationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
