"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@/lib/auth-schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/dashboard",
  MANAGER: "/manager/dashboard",
  STORE_MANAGER: "/store/inventory",
  CASHIER: "/cashier",
};

export function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: SignInInput) {
    setIsLoading(true);
    await authClient.signIn.email(
      { email: data.email, password: data.password },
      {
        onSuccess: (ctx) => {
          toast.success("Welcome back!");
          const role = (ctx.data?.user as { role?: string })?.role ?? "";
          router.push(ROLE_HOME[role] ?? "/cashier");
        },
        onError: (ctx) => {
          form.setError("root", { message: ctx.error.message });
          toast.error(ctx.error.message);
          setIsLoading(false);
        },
      }
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="TPAPOS" className="w-32 h-32 object-contain mx-auto mb-3 rounded-2xl" />
          <h1 className="text-2xl font-bold text-[#F1F0FF]">Welcome back</h1>
          <p className="text-sm text-[#5C5A7A] mt-1">Sign in to your TPAPOS account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#1E1E35] bg-[#0D0D1A] p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {form.formState.errors.root && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-[#A09EC0]">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60] focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm text-[#A09EC0]">Password</FormLabel>
                      <Link href="/forgot-password" className="text-xs text-[#7C3AED] hover:text-[#A78BFA]">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60] focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5A7A] hover:text-[#A09EC0]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-11 mt-2"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-xs text-[#3A3A60]">
          TPAPOS — Run Every Branch. Own Every Sale.
        </p>
      </div>
    </div>
  );

}
