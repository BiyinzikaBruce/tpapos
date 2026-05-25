import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await params;

  const sale = await db.sale.findFirst({
    where: { id, organisationId: orgId },
    include: { items: true },
  });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Restore stock for each item back to the branch
  await Promise.all(
    sale.items.map((item) =>
      db.productBranchStock.updateMany({
        where: { productId: item.productId, branchId: sale.branchId },
        data: { quantity: { increment: item.quantity } },
      })
    )
  );

  await db.sale.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
