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
    `analytics:revenue:${orgId}`,
    async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);

      const sales = await db.sale.findMany({
        where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: since } },
        select: { total: true, createdAt: true, paymentMethod: true },
      });

      // Group by date
      const byDate: Record<string, { total: number; cash: number; momo: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        byDate[key] = { total: 0, cash: 0, momo: 0 };
      }

      for (const sale of sales) {
        const key = sale.createdAt.toISOString().slice(0, 10);
        if (byDate[key]) {
          byDate[key].total += Number(sale.total);
          if (sale.paymentMethod === "CASH") byDate[key].cash += Number(sale.total);
          else byDate[key].momo += Number(sale.total);
        }
      }

      return Object.entries(byDate).map(([date, v]) => ({
        date,
        label: new Date(date).toLocaleDateString("en-UG", { month: "short", day: "numeric" }),
        total: v.total,
        cash: v.cash,
        momo: v.momo,
      }));
    },
    300
  );

  return NextResponse.json(data);
}
