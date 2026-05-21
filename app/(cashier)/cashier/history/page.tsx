import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HistoryClient } from "@/components/cashier/history-client";

export default async function HistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Transaction History</h1>
        <p className="text-sm text-[#A09EC0] mt-1">View and review your sales</p>
      </div>
      <HistoryClient
        branchId={session.user.branchId ?? ""}
        cashierName={session.user.name}
      />
    </div>
  );
}
