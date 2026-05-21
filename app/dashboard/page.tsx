import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const orgId = session.user.organisationId ?? "";

  const now = new Date();
  const since30 = new Date(); since30.setDate(since30.getDate() - 29); since30.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [salesAgg, lastMonthAgg, branches, products, users, recentSales, revenueSeries, branchStats] =
    await Promise.all([
      db.sale.aggregate({ where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      db.sale.aggregate({ where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { total: true }, _count: true }),
      db.branch.count({ where: { organisationId: orgId } }),
      db.product.count({ where: { organisationId: orgId, isActive: true } }),
      db.user.count({ where: { organisationId: orgId } }),
      db.sale.findMany({
        where: { organisationId: orgId, status: "COMPLETED" },
        include: { cashier: { select: { name: true } }, branch: { select: { name: true } }, items: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.sale.findMany({
        where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: since30 } },
        select: { total: true, createdAt: true, paymentMethod: true },
      }),
      db.branch.findMany({
        where: { organisationId: orgId },
        select: { id: true, name: true, sales: { where: { status: "COMPLETED", createdAt: { gte: since30 } }, select: { total: true } } },
      }),
    ]);

  const revenue = Number(salesAgg._sum.total ?? 0);
  const lastRevenue = Number(lastMonthAgg._sum.total ?? 0);
  const revenueTrend = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0;
  const countTrend = lastMonthAgg._count > 0 ? ((salesAgg._count - lastMonthAgg._count) / lastMonthAgg._count) * 100 : 0;

  // Build 30-day series
  const byDate: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(since30); d.setDate(d.getDate() + i);
    byDate[d.toISOString().slice(0, 10)] = 0;
  }
  for (const s of revenueSeries) {
    const key = s.createdAt.toISOString().slice(0, 10);
    if (byDate[key] !== undefined) byDate[key] += Number(s.total);
  }
  const chartData = Object.entries(byDate).map(([date, total]) => ({
    date,
    label: new Date(date + "T12:00:00").toLocaleDateString("en-UG", { month: "short", day: "numeric" }),
    total,
  }));

  // Payment breakdown
  const paymentMap: Record<string, number> = { CASH: 0, MTN_MOMO: 0, AIRTEL_MONEY: 0 };
  for (const s of revenueSeries) paymentMap[s.paymentMethod] = (paymentMap[s.paymentMethod] ?? 0) + Number(s.total);

  const branchChartData = branchStats.map((b) => ({
    name: b.name.replace(" Branch", "").replace(" Store", "").replace(" Outlet", ""),
    revenue: b.sales.reduce((sum, s) => sum + Number(s.total), 0),
    salesCount: b.sales.length,
  }));

  return (
    <AdminDashboard
      stats={{ revenue, revenueTrend, salesCount: salesAgg._count, countTrend, branches, products, users }}
      chartData={chartData}
      branchData={branchChartData}
      paymentData={paymentMap}
      recentSales={recentSales.map((s) => ({
        id: s.id,
        cashier: s.cashier.name,
        branch: s.branch.name,
        paymentMethod: s.paymentMethod,
        total: Number(s.total),
        itemCount: s.items.length,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
