import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TPAPOS — Run Every Branch. Own Every Sale.",
  description: "Multi-branch POS and business management platform for Ugandan businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full bg-[#0B0B18] text-[#F1F0FF] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
