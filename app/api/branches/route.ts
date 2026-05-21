import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTag } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const branches = await db.branch.findMany({
    where: { organisationId: orgId },
    include: { _count: { select: { users: true, sales: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { name, location, phone } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const branch = await db.branch.create({ data: { name, location, phone, organisationId: orgId } });
  await invalidateTag(`branches:${orgId}`);
  return NextResponse.json(branch, { status: 201 });
}
