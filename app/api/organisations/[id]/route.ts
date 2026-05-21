import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await params;
  if (id !== orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, lowStockThreshold } = await req.json();
  const org = await db.organisation.update({
    where: { id: orgId },
    data: { ...(name && { name }), ...(lowStockThreshold !== undefined && { lowStockThreshold }) },
  });
  return NextResponse.json(org);
}
