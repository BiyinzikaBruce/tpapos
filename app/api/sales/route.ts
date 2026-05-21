import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch, invalidateTag } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? session.user.branchId ?? "";
  const dateParam = searchParams.get("date");

  if (!branchId) return NextResponse.json({ error: "No branch" }, { status: 400 });

  const date = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const cacheKey = `sales:${branchId}:${start.toISOString().slice(0, 10)}`;

  const sales = await getCachedOrFetch(
    cacheKey,
    async () => {
      const rows = await db.sale.findMany({
        where: { branchId, createdAt: { gte: start, lte: end } },
        include: {
          cashier: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, name: true, unit: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((s) => ({
        ...s,
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total: Number(s.total),
        items: s.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      }));
    },
    60
  );

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, paymentMethod, discount = 0, items } = body as {
    branchId: string;
    paymentMethod: string;
    discount: number;
    items: { productId: string; quantity: number; unitPrice: number }[];
  };

  if (!branchId || !items?.length) {
    return NextResponse.json({ error: "branchId and items are required" }, { status: 400 });
  }

  // Validate stock for all items
  for (const item of items) {
    const stock = await db.productBranchStock.findUnique({
      where: { productId_branchId: { productId: item.productId, branchId } },
    });
    if (!stock || stock.quantity < item.quantity) {
      const product = await db.product.findUnique({ where: { id: item.productId }, select: { name: true } });
      return NextResponse.json(
        { error: `Insufficient stock for ${product?.name ?? item.productId}` },
        { status: 400 }
      );
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = subtotal - discount;

  const sale = await db.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        organisationId: session.user.organisationId!,
        branchId,
        cashierId: session.user.id,
        paymentMethod: paymentMethod as never,
        subtotal,
        discount,
        total,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.unitPrice * i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of items) {
      await tx.productBranchStock.update({
        where: { productId_branchId: { productId: item.productId, branchId } },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    return created;
  });

  await invalidateTag(`sales:${branchId}`);
  await invalidateTag(`products:${session.user.organisationId}`);

  return NextResponse.json({
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    total: Number(sale.total),
  });
}
