import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedOrFetch, invalidateTag } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sent = searchParams.get("sent") === "true";

  if (sent) {
    const messages = await db.message.findMany({
      where: { senderId: session.user.id },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(messages);
  }

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

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipientId, subject, body } = await req.json();
  if (!recipientId || !subject || !body) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const message = await db.message.create({
    data: { senderId: session.user.id, recipientId, subject, body },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      recipient: { select: { id: true, name: true, role: true } },
    },
  });

  await invalidateTag(`messages:${recipientId}`);

  return NextResponse.json(message, { status: 201 });
}
