import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MessagesClient } from "@/components/cashier/messages-client";

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Messages</h1>
        <p className="text-sm text-[#A09EC0] mt-1">Messages from your manager</p>
      </div>
      <MessagesClient userId={session.user.id} />
    </div>
  );
}
