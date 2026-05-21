import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTag } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, productId, branchId, toBranchId, supplierId, quantity, notes } = body as {
    type: "IN" | "OUT" | "TRANSFER";
    productId: string;
    branchId: string;
    toBranchId?: string;
    supplierId?: string;
    quantity: number;
    notes?: string;
  };

  const orgId = session.user.organisationId!;
  const org = await db.organisation.findUnique({ where: { id: orgId }, select: { lowStockThreshold: true } });

  const entry = await db.$transaction(async (tx) => {
    const created = await tx.stockEntry.create({
      data: {
        type: type as never,
        quantity,
        notes: notes ?? null,
        organisationId: orgId,
        branchId,
        productId,
        supplierId: supplierId ?? null,
        userId: session.user.id,
        toBranchId: type === "TRANSFER" ? (toBranchId ?? null) : null,
        transferStatus: type === "TRANSFER" ? "PENDING" : null,
      },
    });

    if (type === "IN") {
      await tx.productBranchStock.upsert({
        where: { productId_branchId: { productId, branchId } },
        update: { quantity: { increment: quantity } },
        create: { productId, branchId, quantity },
      });
    } else if (type === "OUT") {
      await tx.productBranchStock.update({
        where: { productId_branchId: { productId, branchId } },
        data: { quantity: { decrement: quantity } },
      });
    }

    return created;
  });

  // Check low stock
  const stock = await db.productBranchStock.findUnique({
    where: { productId_branchId: { productId, branchId } },
  });

  if (stock && org && stock.quantity < org.lowStockThreshold) {
    const product = await db.product.findUnique({ where: { id: productId }, select: { name: true } });
    await db.notification.create({
      data: {
        organisationId: orgId,
        userId: session.user.id,
        type: "LOW_STOCK",
        title: "Low Stock Alert",
        body: `${product?.name} is below threshold at this branch (stock: ${stock.quantity}).`,
      },
    }).catch(() => {});
  }

  await invalidateTag(`stock:${orgId}`);
  await invalidateTag(`products:${orgId}`);

  return NextResponse.json(entry);
}
