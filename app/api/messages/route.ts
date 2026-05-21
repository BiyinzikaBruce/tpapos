import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await getCachedOrFetch(
    `messages:${session.user.id}`,
    () =>
      db.message.findMany({
        where: { recipientId: session.user.id },
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      }),
    60
  );

  return NextResponse.json(messages);
}
