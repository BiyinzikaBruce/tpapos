import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const users = await db.user.findMany({
    where: { organisationId: orgId },
    select: { id: true, name: true, email: true, role: true, branchId: true, createdAt: true, branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { name, email, password, role, branchId } = await req.json();
  if (!name || !email || !password || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  // Use Better Auth to create the user (handles password hashing internally)
  const signUpResult = await auth.api.signUpEmail({
    body: { name, email, password, role, organisationId: orgId, branchId: branchId || "" },
  });
  if (!signUpResult || "error" in signUpResult) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Update org/branch/role on the created user
  const [user, org] = await Promise.all([
    db.user.update({
      where: { email },
      data: { role, organisationId: orgId, branchId: branchId || null },
      select: { id: true, name: true, email: true, role: true, branchId: true, createdAt: true },
    }),
    db.organisation.findUnique({ where: { id: orgId }, select: { name: true } }),
  ]);

  sendWelcomeEmail({ to: email, name, tempPassword: password, role, orgName: org?.name ?? "Your Organisation" }).catch(() => {});

  return NextResponse.json(user, { status: 201 });
}
