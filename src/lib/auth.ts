import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  employeeId: string | null;
  avatarUrl: string | null;
};

/**
 * Require an authenticated user. Redirects to /login if not signed in.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

/**
 * Require the user to have one of the allowed roles. Redirects to /unauthorized
 * (or /login if not signed in) otherwise.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/unauthorized");
  return user;
}

export function isSuperAdmin(user: SessionUser) {
  return user.role === UserRole.SUPER_ADMIN;
}

/** Roles that can manage tenant resources (admin/manager/staff). */
export function isTenantManager(user: SessionUser) {
  return ([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role);
}
