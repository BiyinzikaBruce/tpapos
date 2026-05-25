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
  const { name, sku, price, costPrice, unit, categoryId, isActive, stockQty } = await req.json();

  const product = await db.product.update({
    where: { id, organisationId: orgId },
    data: { name, sku, price, costPrice, unit, categoryId, isActive },
    include: { category: true },
  });

  let resolvedStock: number | undefined;
  if (typeof stockQty === "number" && stockQty >= 0) {
    const qty = Math.floor(stockQty);
    const branches = await db.branch.findMany({ where: { organisationId: orgId }, select: { id: true } });
    await Promise.all(
      branches.map((b) =>
        db.productBranchStock.upsert({
          where: { productId_branchId: { productId: id, branchId: b.id } },
          update: { quantity: qty },
          create: { productId: id, branchId: b.id, quantity: qty },
        })
      )
    );
    resolvedStock = qty;
  }

  await invalidateTag(`products:${orgId}`);
  return NextResponse.json({ ...product, price: Number(product.price), costPrice: product.costPrice ? Number(product.costPrice) : null, ...(resolvedStock !== undefined && { stock: resolvedStock }) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await params;
  await db.product.update({ where: { id, organisationId: orgId }, data: { isActive: false } });
  await invalidateTag(`products:${orgId}`);
  return NextResponse.json({ ok: true });
}
