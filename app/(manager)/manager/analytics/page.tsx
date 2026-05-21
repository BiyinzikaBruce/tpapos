import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/admin/analytics-client";
import { subDays, startOfDay } from "date-fns";

export default async function ManagerAnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  const branchId = (session.user as { branchId?: string }).branchId;
  if (!orgId) redirect("/login");

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));

  const where = {
    organisationId: orgId,
    createdAt: { gte: thirtyDaysAgo },
    status: "COMPLETED" as const,
    ...(branchId ? { branchId } : {}),
  };

  const [sales, branches] = await Promise.all([
    db.sale.findMany({
      where,
      select: { total: true, paymentMethod: true, createdAt: true, branchId: true, branch: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    branchId
      ? db.branch.findMany({ where: { id: branchId }, select: { id: true, name: true } })
      : db.branch.findMany({ where: { organisationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const dailyMap: Record<string, { total: number; cash: number; momo: number; count: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { total: 0, cash: 0, momo: 0, count: 0 };
  }
  for (const s of sales) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (!dailyMap[key]) continue;
    const t = Number(s.total);
    dailyMap[key].total += t;
    dailyMap[key].count += 1;
    if (s.paymentMethod === "CASH") dailyMap[key].cash += t;
    else dailyMap[key].momo += t;
  }
  const dailySeries = Object.entries(dailyMap).map(([date, v]) => ({ label: date.slice(5), ...v }));

  const branchMap: Record<string, { name: string; revenue: number; salesCount: number }> = {};
  for (const b of branches) branchMap[b.id] = { name: b.name, revenue: 0, salesCount: 0 };
  for (const s of sales) {
    if (!branchMap[s.branchId]) continue;
    branchMap[s.branchId].revenue += Number(s.total);
    branchMap[s.branchId].salesCount += 1;
  }

  const pmTotals: Record<string, number> = { CASH: 0, MTN_MOMO: 0, AIRTEL_MONEY: 0 };
  for (const s of sales) pmTotals[s.paymentMethod] = (pmTotals[s.paymentMethod] ?? 0) + Number(s.total);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Analytics</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">30-day performance for your branch</p>
      </div>
      <AnalyticsClient
        dailySeries={dailySeries}
        branchData={Object.values(branchMap).sort((a, b) => b.revenue - a.revenue)}
        pmTotals={pmTotals}
        totalRevenue={totalRevenue}
        totalSales={sales.length}
        avgSaleValue={sales.length ? totalRevenue / sales.length : 0}
      />
    </div>
  );
}
