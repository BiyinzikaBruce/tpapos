import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReportsClient } from "@/components/admin/reports-client";

export default async function AdminReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const [reports, branches, todaySalesRaw] = await Promise.all([
    db.dailyReport.findMany({
      where: { organisationId: orgId },
      include: { cashier: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    db.branch.findMany({ where: { organisationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.sale.findMany({
      where: { organisationId: orgId, status: "COMPLETED", createdAt: { gte: todayStart, lte: todayEnd } },
      select: { total: true, paymentMethod: true, branchId: true, branch: { select: { name: true } } },
    }),
  ]);

  const byBranch: Record<string, { branchName: string; total: number; count: number }> = {};
  let todayCash = 0, todayMomo = 0, todayAirtel = 0;
  for (const s of todaySalesRaw) {
    if (!byBranch[s.branchId]) byBranch[s.branchId] = { branchName: s.branch.name, total: 0, count: 0 };
    byBranch[s.branchId].total += Number(s.total);
    byBranch[s.branchId].count += 1;
    if (s.paymentMethod === "CASH") todayCash += Number(s.total);
    else if (s.paymentMethod === "MTN_MOMO") todayMomo += Number(s.total);
    else if (s.paymentMethod === "AIRTEL_MONEY") todayAirtel += Number(s.total);
  }
  const todaySummary = {
    totalRevenue: todaySalesRaw.reduce((sum, s) => sum + Number(s.total), 0),
    salesCount: todaySalesRaw.length,
    cash: todayCash,
    momo: todayMomo,
    airtel: todayAirtel,
    byBranch: Object.entries(byBranch).map(([branchId, v]) => ({ branchId, ...v })),
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Daily Reports</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Review cashier end-of-day reports</p>
      </div>
      <ReportsClient
        initialReports={reports.map((r) => ({ ...r, totalSales: Number(r.totalSales), cashAmount: Number(r.cashAmount), momoAmount: Number(r.momoAmount) }))}
        branches={branches}
        todaySummary={todaySummary}
      />
    </div>
  );
}
