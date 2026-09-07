import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// This app is fully database/auth-driven — no pages can be statically prerendered.
// Force dynamic rendering so Vercel doesn't attempt SSG at build time (which fails
// because NEXTAUTH_URL / DATABASE_URL are only available at runtime).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WorkHub — Attendance, Payroll & Vacation",
  description:
    "Multi-tenant workforce management for attendance, payroll, salary and vacation with visa/Emirates/iqama tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
