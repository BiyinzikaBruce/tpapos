import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReportsClient } from "@/components/admin/reports-client";

export default async function ManagerReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  const branchId = (session.user as { branchId?: string }).branchId;
  if (!orgId) redirect("/login");

  const where = { organisationId: orgId, ...(branchId ? { branchId } : {}) };

  const [reports, branches] = await Promise.all([
    db.dailyReport.findMany({
      where,
      include: { cashier: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    branchId
      ? db.branch.findMany({ where: { id: branchId }, select: { id: true, name: true } })
      : db.branch.findMany({ where: { organisationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Reports</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Daily cashier reports for your branch</p>
      </div>
      <ReportsClient
        initialReports={reports.map((r) => ({ ...r, totalSales: Number(r.totalSales), cashAmount: Number(r.cashAmount), momoAmount: Number(r.momoAmount) }))}
        branches={branches}
      />
    </div>
  );
}
