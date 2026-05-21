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

  const where: Record<string, unknown> = { organisationId: orgId };
  if (branchId) where.branchId = branchId;

  const reports = await db.dailyReport.findMany({
    where,
    include: {
      cashier: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(reports.map((r) => ({
    ...r,
    totalSales: Number(r.totalSales),
    cashAmount: Number(r.cashAmount),
    momoAmount: Number(r.momoAmount),
  })));
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await req.json();
  await db.dailyReport.update({ where: { id, organisationId: orgId }, data: { isReviewed: true } });
  return NextResponse.json({ ok: true });
}
