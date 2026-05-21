import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;

  const where: Record<string, unknown> = { organisationId: orgId };
  if (branchId) where.branchId = branchId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, Date>).lte = end;
    }
  }

  const [sales, total] = await db.$transaction([
    db.sale.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, unit: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.sale.count({ where }),
  ]);

  return NextResponse.json({
    sales: sales.map((s) => ({
      ...s,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      total: Number(s.total),
      items: s.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice), total: Number(i.total) })),
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
