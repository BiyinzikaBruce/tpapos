import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { sendLowStockEmail, sendTransferRequestEmail } from "@/lib/email";

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

  // Post-entry side effects (fire-and-forget)
  void (async () => {
    if (type === "TRANSFER" && toBranchId) {
      const [product, fromBranch, toBranchDoc, admins] = await Promise.all([
        db.product.findUnique({ where: { id: productId }, select: { name: true, sku: true } }),
        db.branch.findUnique({ where: { id: branchId }, select: { name: true } }),
        db.branch.findUnique({ where: { id: toBranchId }, select: { name: true } }),
        db.user.findMany({ where: { organisationId: orgId, role: { in: ["ADMIN", "MANAGER"] as never[] } }, select: { email: true } }),
      ]);
      if (product && fromBranch && toBranchDoc) {
        await sendTransferRequestEmail({
          to: admins.map((u) => u.email),
          requesterName: session.user.name,
          productName: product.name,
          sku: product.sku ?? "",
          quantity,
          fromBranch: fromBranch.name,
          toBranch: toBranchDoc.name,
          notes,
        });
      }
    }

    if (type === "OUT" || type === "IN") {
      const stock = await db.productBranchStock.findUnique({
        where: { productId_branchId: { productId, branchId } },
      });
      if (stock && org && stock.quantity < org.lowStockThreshold) {
        const [product, branch, admins] = await Promise.all([
          db.product.findUnique({ where: { id: productId }, select: { name: true, sku: true } }),
          db.branch.findUnique({ where: { id: branchId }, select: { name: true } }),
          db.user.findMany({ where: { organisationId: orgId, role: { in: ["ADMIN", "MANAGER"] as never[] } }, select: { email: true } }),
        ]);
        if (product && branch) {
          await db.notification.create({
            data: {
              organisationId: orgId,
              userId: session.user.id,
              type: "LOW_STOCK",
              title: "Low Stock Alert",
              body: `${product.name} is below threshold at ${branch.name} (stock: ${stock.quantity}).`,
            },
          }).catch(() => {});
          await sendLowStockEmail({
            to: admins.map((u) => u.email),
            productName: product.name,
            sku: product.sku ?? "",
            branchName: branch.name,
            currentQty: stock.quantity,
            threshold: org.lowStockThreshold,
          });
        }
      }
    }
  })();

  await invalidateTag(`stock:${orgId}`);
  await invalidateTag(`products:${orgId}`);

  return NextResponse.json(entry);
}
