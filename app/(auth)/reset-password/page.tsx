import type { Metadata } from "next";
import { ResetPassword } from "@/components/auth";

export const metadata: Metadata = { title: "Reset Password — TPAPOS" };

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
