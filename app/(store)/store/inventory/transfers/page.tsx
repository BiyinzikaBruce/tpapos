import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TransfersClient } from "@/components/store/transfers-client";

export default async function TransfersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const orgId = session.user.organisationId ?? "";

  const transfers = await db.stockEntry.findMany({
    where: { organisationId: orgId, type: "TRANSFER" },
    include: {
      product: { select: { name: true, sku: true } },
      branch: { select: { name: true } },
      toBranch: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Stock Transfers</h1>
        <p className="text-sm text-[#A09EC0] mt-1">Approve or reject inter-branch transfer requests</p>
      </div>
      <TransfersClient
        transfers={transfers.map((t) => ({
          id: t.id,
          quantity: t.quantity,
          notes: t.notes,
          status: t.transferStatus ?? "PENDING",
          createdAt: t.createdAt.toISOString(),
          product: t.product,
          fromBranch: t.branch.name,
          toBranch: t.toBranch?.name ?? "—",
          requestedBy: t.user.name,
        }))}
      />
    </div>
  );
}
