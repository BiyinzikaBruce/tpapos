import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireSuperAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") return null;
  return session;
}

// GET — list admins for an org
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const admins = await db.user.findMany({
    where: { organisationId: id, role: "ADMIN" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(admins);
}

// POST — create a new admin user for an org
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const org = await db.organisation.findUnique({ where: { id } });
  if (!org) return NextResponse.json({ error: "Organisation not found" }, { status: 404 });

  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const signUpResult = await auth.api.signUpEmail({
    body: { name, email, password },
  });
  if (!signUpResult || "error" in signUpResult) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  const user = await db.user.update({
    where: { email },
    data: { role: "ADMIN", organisationId: id, branchId: null },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}

// PATCH — update an admin's name/email
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: orgId } = await params;

  const { userId, name, email } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const admin = await db.user.findFirst({ where: { id: userId, organisationId: orgId, role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  if (email && email !== admin.email) {
    const taken = await db.user.findUnique({ where: { email } });
    if (taken) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { ...(name && { name }), ...(email && { email }) },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return NextResponse.json(updated);
}

// DELETE — remove admin role (demote to CASHIER / unlink from org)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: orgId } = await params;

  const { userId } = await req.json();
  const admin = await db.user.findFirst({ where: { id: userId, organisationId: orgId, role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  await db.user.update({ where: { id: userId }, data: { role: "CASHIER", organisationId: null, branchId: null } });
  return NextResponse.json({ ok: true });
}
