import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.user.organisationId ?? "";

  const data = await getCachedOrFetch(
    `analytics:branches:${orgId}`,
    async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);

      const branches = await db.branch.findMany({
        where: { organisationId: orgId },
        select: {
          id: true,
          name: true,
          sales: {
            where: { status: "COMPLETED", createdAt: { gte: since } },
            select: { total: true },
          },
        },
      });

      return branches.map((b) => ({
        name: b.name,
        revenue: b.sales.reduce((sum, s) => sum + Number(s.total), 0),
        salesCount: b.sales.length,
      }));
    },
    300
  );

  return NextResponse.json(data);
}
