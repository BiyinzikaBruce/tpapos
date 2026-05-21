import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/admin/notifications-client";

export default async function AdminNotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { organisationId: orgId, userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Notifications</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">System alerts and updates</p>
      </div>
      <NotificationsClient initialNotifications={notifications} />
    </div>
  );
}
