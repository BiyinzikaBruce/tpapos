import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTag } from "@/lib/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json() as { action: "VOID" };

  if (action !== "VOID") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const sale = await db.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  if (sale.organisationId !== session.user.organisationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (sale.status === "VOIDED") {
    return NextResponse.json({ error: "Sale already voided" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.sale.update({ where: { id }, data: { status: "VOIDED" } });
    // Restore stock for each item
    for (const item of sale.items) {
      await tx.productBranchStock.update({
        where: { productId_branchId: { productId: item.productId, branchId: sale.branchId } },
        data: { quantity: { increment: item.quantity } },
      });
    }
  });

  await invalidateTag(`sales:${sale.branchId}`);
  await invalidateTag(`products:${sale.organisationId}`);

  return NextResponse.json({ ok: true });
}
