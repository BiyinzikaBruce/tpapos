import { redirect } from "next/navigation";

// Manager dashboard mirrors the admin view — redirect for now until manager-specific view is built
export default function ManagerDashboardPage() {
  redirect("/dashboard");
}
