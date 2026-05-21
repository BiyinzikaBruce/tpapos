import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch, invalidateTag } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.user.organisationId ?? "";
  const suppliers = await getCachedOrFetch(
    `suppliers:${orgId}`,
    () => db.supplier.findMany({ where: { organisationId: orgId }, orderBy: { name: "asc" } }),
    300
  );

  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supplier = await db.supplier.create({
    data: { ...body, organisationId: session.user.organisationId! },
  });

  await invalidateTag(`suppliers:${session.user.organisationId}`);
  return NextResponse.json(supplier);
}
