import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTag } from "@/lib/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Category name is required" }, { status: 400 });

  const cat = await db.category.findFirst({ where: { id, organisationId: orgId } });
  if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const duplicate = await db.category.findFirst({ where: { name: name.trim(), organisationId: orgId, NOT: { id } } });
  if (duplicate) return NextResponse.json({ error: "Category name already in use" }, { status: 409 });

  const updated = await db.category.update({
    where: { id },
    data: { name: name.trim() },
    select: { id: true, name: true, _count: { select: { products: true } } },
  });

  await invalidateTag(`categories:${orgId}`);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await params;
  const cat = await db.category.findFirst({
    where: { id, organisationId: orgId },
    include: { _count: { select: { products: true } } },
  });
  if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  if (cat._count.products > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${cat._count.products} product(s) use this category. Reassign them first.` },
      { status: 409 }
    );
  }

  await db.category.delete({ where: { id } });
  await invalidateTag(`categories:${orgId}`);
  return NextResponse.json({ ok: true });
}
