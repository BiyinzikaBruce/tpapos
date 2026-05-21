import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminMessagesClient } from "@/components/admin/admin-messages-client";

export default async function AdminMessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const [messages, users] = await Promise.all([
    db.message.findMany({
      where: { OR: [{ senderId: session.user.id }, { recipientId: session.user.id }] },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.user.findMany({
      where: { organisationId: orgId, id: { not: session.user.id } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Messages</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Internal staff communications</p>
      </div>
      <AdminMessagesClient initialMessages={messages} users={users} currentUserId={session.user.id} />
    </div>
  );
}
