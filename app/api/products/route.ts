import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch, invalidateTag } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("organisationId") ?? session.user.organisationId ?? "";
  const branchId = searchParams.get("branchId") ?? session.user.branchId ?? "";

  if (!organisationId) return NextResponse.json({ error: "No organisation" }, { status: 400 });

  const cacheKey = `products:${organisationId}:${branchId}`;

  const products = await getCachedOrFetch(
    cacheKey,
    async () => {
      const rows = await db.product.findMany({
        where: { organisationId, isActive: true },
        include: {
          category: { select: { id: true, name: true } },
          branchStocks: branchId ? { where: { branchId }, select: { quantity: true } } : { select: { quantity: true } },
        },
        orderBy: { name: "asc" },
      });
      return rows.map((p) => ({
        ...p,
        price: Number(p.price),
        costPrice: p.costPrice ? Number(p.costPrice) : null,
        stock: p.branchStocks[0]?.quantity ?? 0,
      }));
    },
    120
  );

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { name, sku, price, costPrice, unit, categoryId } = await req.json();
  if (!name || !price || !categoryId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const product = await db.product.create({
    data: { name, sku, price, costPrice: costPrice || null, unit: unit || "pcs", categoryId, organisationId: orgId },
    include: { category: true },
  });
  await invalidateTag(`products:${orgId}`);
  return NextResponse.json({ ...product, price: Number(product.price), costPrice: product.costPrice ? Number(product.costPrice) : null }, { status: 201 });
}
