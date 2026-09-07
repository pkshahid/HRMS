"use client";

import { Bell, Search, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { initials, cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { UserRole } from "@prisma/client";

type TopbarUser = {
  name?: string | null;
  email?: string | null;
  role: UserRole;
  tenantName?: string | null;
};

export function Topbar({ user, onMenuClick }: { user: TopbarUser; onMenuClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-ink-200 bg-white/90 px-3 backdrop-blur sm:h-16 sm:gap-3 sm:px-4">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* search */}
      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Search employees, leaves, payroll..."
          className="w-full rounded-lg border border-ink-200 bg-ink-50 py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* notifications */}
        <button className="relative rounded-md p-2 text-ink-600 hover:bg-ink-100" title="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
        </button>

        {/* user menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {initials(user.name)}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-medium leading-tight text-ink-900">{user.name}</div>
              <div className="text-xs capitalize text-ink-500">{user.role.replace("_", " ").toLowerCase()}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-pop">
              <div className="border-b border-ink-100 px-4 py-3">
                <div className="text-sm font-medium text-ink-900">{user.name}</div>
                <div className="truncate text-xs text-ink-500">{user.email}</div>
                {user.tenantName && (
                  <div className="mt-1 text-xs text-brand-600">{user.tenantName}</div>
                )}
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
              >
                My Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
              >
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={cn("block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50")}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
