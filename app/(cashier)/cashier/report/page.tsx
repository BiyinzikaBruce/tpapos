import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReportForm } from "@/components/cashier/report-form";

export default async function ReportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Daily Report</h1>
        <p className="text-sm text-[#A09EC0] mt-1">Submit your end-of-day sales summary</p>
      </div>
      <ReportForm
        branchId={session.user.branchId ?? ""}
        cashierId={session.user.id}
        organisationId={session.user.organisationId ?? ""}
      />
    </div>
  );
}
