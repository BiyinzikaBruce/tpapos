import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";
import { sendDailyReportEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? session.user.branchId ?? "";
  const organisationId = session.user.organisationId ?? "";

  const reports = await getCachedOrFetch(
    `reports:${branchId}`,
    async () => {
      const rows = await db.dailyReport.findMany({
        where: { branchId, organisationId },
        include: {
          cashier: { select: { name: true } },
          branch: { select: { name: true } },
        },
        orderBy: { date: "desc" },
        take: 30,
      });
      return rows.map((r) => ({
        ...r,
        totalSales: Number(r.totalSales),
        cashAmount: Number(r.cashAmount),
        momoAmount: Number(r.momoAmount),
      }));
    },
    120
  );

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, date, totalSales, cashAmount, momoAmount, salesCount, notes } = body as {
    branchId: string;
    date: string;
    totalSales: number;
    cashAmount: number;
    momoAmount: number;
    salesCount: number;
    notes?: string;
  };

  const reportDate = new Date(date);
  reportDate.setHours(0, 0, 0, 0);

  try {
    const report = await db.dailyReport.create({
      data: {
        organisationId: session.user.organisationId!,
        branchId,
        cashierId: session.user.id,
        date: reportDate,
        totalSales,
        cashAmount,
        momoAmount,
        salesCount,
        notes: notes ?? null,
      },
      include: { branch: { select: { name: true } } },
    });

    // Send email to admin
    const admin = await db.user.findFirst({
      where: { organisationId: session.user.organisationId!, role: "ADMIN" },
      select: { email: true, name: true },
    });

    if (admin) {
      await sendDailyReportEmail({
        to: admin.email,
        adminName: admin.name,
        cashierName: session.user.name,
        branchName: report.branch.name,
        date: reportDate.toLocaleDateString("en-UG"),
        totalSales,
        cashAmount,
        momoAmount,
        salesCount,
        notes,
      }).catch(() => {});
    }

    return NextResponse.json({ ...report, totalSales, cashAmount, momoAmount });
  } catch {
    return NextResponse.json({ error: "Report for this date may already exist" }, { status: 400 });
  }
}
