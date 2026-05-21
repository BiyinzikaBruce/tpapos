import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.user.organisationId ?? "";
  if (!orgId) return NextResponse.json({ error: "No organisation" }, { status: 400 });

  const data = await getCachedOrFetch(
    `analytics:overview:${orgId}`,
    async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const [salesAgg, lastMonthAgg, salesCount, lastMonthCount, branches, products, users] =
        await Promise.all([
          db.sale.aggregate({
            where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: startOfMonth } },
            _sum: { total: true },
            _count: true,
          }),
          db.sale.aggregate({
            where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            _sum: { total: true },
            _count: true,
          }),
          db.sale.count({ where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: startOfMonth } } }),
          db.sale.count({ where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
          db.branch.count({ where: { organisationId: orgId } }),
          db.product.count({ where: { organisationId: orgId, isActive: true } }),
          db.user.count({ where: { organisationId: orgId } }),
        ]);

      const revenue = Number(salesAgg._sum.total ?? 0);
      const lastRevenue = Number(lastMonthAgg._sum.total ?? 0);
      const revenueTrend = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0;
      const countTrend = lastMonthCount > 0 ? ((salesCount - lastMonthCount) / lastMonthCount) * 100 : 0;

      return { revenue, revenueTrend, salesCount, countTrend, branches, products, users };
    },
    300
  );

  return NextResponse.json(data);
}
