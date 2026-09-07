"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/lib/nav";
import { UserRole } from "@prisma/client";
import { cn, initials } from "@/lib/utils";
import { ChevronLeft, LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { WorkHubLogo } from "@/components/logo";

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  role: UserRole;
  tenantName?: string | null;
};

export function Sidebar({
  user,
  mobileOpen,
  onClose,
}: {
  user: SidebarUser;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = navForRole(user.role);

  // group items
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <>
      {/* mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 text-ink-100 transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* brand */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <WorkHubLogo className="h-8 w-8" />
            <div className="leading-tight">
              <div className="text-base font-semibold text-white">WorkHub</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400">
                Workforce Suite
              </div>
            </div>
          </Link>
          <button
            className="rounded-md p-1.5 text-ink-400 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* tenant chip */}
        {user.tenantName && (
          <div className="mx-3 mt-3 rounded-lg bg-white/5 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-ink-400">Organization</div>
            <div className="truncate text-sm font-medium text-white">{user.tenantName}</div>
          </div>
        )}

        {/* nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {Object.entries(groups).map(([group, groupItems]) => (
            <div key={group} className="mb-5">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                {group}
              </div>
              <ul className="space-y-1">
                {groupItems.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-600 text-white"
                            : "text-ink-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* user footer */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{user.name}</div>
              <div className="truncate text-xs text-ink-400">{user.role.replace("_", " ").toLowerCase()}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md p-1.5 text-ink-400 hover:bg-white/10 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
      aria-label="Open sidebar"
    >
      <ChevronLeft className="h-5 w-5 rotate-180" />
    </button>
  );
}
