import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const messages = await db.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      recipient: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const senderId = session.user.id;
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { recipientId, subject, body } = await req.json();
  if (!recipientId || !subject || !body) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const message = await db.message.create({
    data: { senderId, recipientId, subject, body },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      recipient: { select: { id: true, name: true, role: true } },
    },
  });
  return NextResponse.json(message, { status: 201 });
}
