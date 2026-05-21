import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? session.user.branchId ?? "";
  const orgId = session.user.organisationId ?? "";

  const data = await getCachedOrFetch(
    `stock:${orgId}:${branchId}`,
    async () => {
      const rows = await db.productBranchStock.findMany({
        where: { branchId, product: { organisationId: orgId, isActive: true } },
        include: {
          product: { include: { category: { select: { id: true, name: true } } } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { product: { name: "asc" } },
      });

      return rows.map((r) => ({
        id: r.id,
        quantity: r.quantity,
        branchId: r.branchId,
        branchName: r.branch.name,
        product: {
          id: r.product.id,
          name: r.product.name,
          sku: r.product.sku,
          unit: r.product.unit,
          price: Number(r.product.price),
          category: r.product.category,
        },
      }));
    },
    120
  );

  return NextResponse.json(data);
}
