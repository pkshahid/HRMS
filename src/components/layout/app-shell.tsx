"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { redirect } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!session?.user) redirect("/login");

  const user = session.user as any;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          tenantName: user.tenantName,
        }}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
            tenantName: user.tenantName,
          }}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
