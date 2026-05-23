import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch, invalidateTag } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("organisationId") ?? (session.user as { organisationId?: string }).organisationId ?? "";

  if (!organisationId) return NextResponse.json({ error: "No organisation" }, { status: 400 });

  const categories = await getCachedOrFetch(
    `categories:${organisationId}`,
    () =>
      db.category.findMany({
        where: { organisationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, _count: { select: { products: true } } },
      }),
    300
  );

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Category name is required" }, { status: 400 });

  const existing = await db.category.findFirst({ where: { name: name.trim(), organisationId: orgId } });
  if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 409 });

  const category = await db.category.create({
    data: { name: name.trim(), organisationId: orgId },
    select: { id: true, name: true, _count: { select: { products: true } } },
  });

  await invalidateTag(`categories:${orgId}`);
  return NextResponse.json(category, { status: 201 });
}
