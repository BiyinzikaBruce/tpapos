import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTag } from "@/lib/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db.message.update({
    where: { id, recipientId: session.user.id },
    data: { isRead: true },
  });

  await invalidateTag(`messages:${session.user.id}`);

  return NextResponse.json({ ok: true });
}
