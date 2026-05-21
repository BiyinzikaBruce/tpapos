import type { Metadata } from "next";
import { SignIn } from "@/components/auth";

export const metadata: Metadata = { title: "Sign In — TPAPOS" };

export default function LoginPage() {
  return <SignIn />;
}
