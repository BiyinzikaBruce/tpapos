import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MessagesClient } from "@/components/cashier/messages-client";

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const orgId = (session.user as { organisationId?: string }).organisationId;

  const adminUsers = orgId
    ? await db.user.findMany({
        where: { organisationId: orgId, role: { in: ["ADMIN", "MANAGER"] } },
        select: { id: true, name: true, role: true },
      })
    : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Messages</h1>
        <p className="text-sm text-[#A09EC0] mt-1">Communicate with your manager</p>
      </div>
      <MessagesClient userId={session.user.id} adminUsers={adminUsers} />
    </div>
  );
}
