import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("organisationId") ?? session.user.organisationId ?? "";

  if (!organisationId) return NextResponse.json({ error: "No organisation" }, { status: 400 });

  const categories = await getCachedOrFetch(
    `categories:${organisationId}`,
    () =>
      db.category.findMany({
        where: { organisationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    300
  );

  return NextResponse.json(categories);
}
