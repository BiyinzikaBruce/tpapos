import type { Metadata } from "next";
import { ForgetPassword } from "@/components/auth";

export const metadata: Metadata = { title: "Forgot Password — TPAPOS" };

export default function ForgotPasswordPage() {
  return <ForgetPassword />;
}
