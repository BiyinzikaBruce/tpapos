import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTag } from "@/lib/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json() as { action: "APPROVE" | "REJECT" };

  const entry = await db.stockEntry.findUnique({ where: { id } });
  if (!entry || entry.type !== "TRANSFER") return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "APPROVE" && entry.toBranchId) {
    const toBranchId = entry.toBranchId;
    await db.$transaction(async (tx) => {
      await tx.stockEntry.update({ where: { id }, data: { transferStatus: "APPROVED" } });
      await tx.productBranchStock.update({
        where: { productId_branchId: { productId: entry.productId, branchId: entry.branchId } },
        data: { quantity: { decrement: entry.quantity } },
      });
      await tx.productBranchStock.upsert({
        where: { productId_branchId: { productId: entry.productId, branchId: toBranchId } },
        update: { quantity: { increment: entry.quantity } },
        create: { productId: entry.productId, branchId: toBranchId, quantity: entry.quantity },
      });
    });
  } else {
    await db.stockEntry.update({ where: { id }, data: { transferStatus: "REJECTED" } });
  }

  await invalidateTag(`stock:${entry.organisationId}`);
  return NextResponse.json({ ok: true });
}
