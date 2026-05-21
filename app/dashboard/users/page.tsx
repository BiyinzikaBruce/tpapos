import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/admin/users-client";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) redirect("/login");

  const [users, branches] = await Promise.all([
    db.user.findMany({
      where: { organisationId: orgId },
      select: { id: true, name: true, email: true, role: true, branchId: true, createdAt: true, branch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.branch.findMany({
      where: { organisationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Users</h1>
        <p className="text-sm text-[#5C5A7A] mt-1">Manage staff accounts and roles</p>
      </div>
      <UsersClient initialUsers={users} branches={branches} />
    </div>
  );
}
