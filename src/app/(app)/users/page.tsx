import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { Users, UserCheck, Shield, User } from "lucide-react";
import { TenantUsersClient } from "@/components/users/tenant-users-client";

export default async function UsersPage() {
  const user = await requireRole(UserRole.ADMIN);

  const users = await prisma.user.findMany({
    where: {
      tenantId: user.tenantId!,
      role: { not: UserRole.SUPER_ADMIN },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      phone: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [totalUsers, activeUsers, managers, employees] = await Promise.all([
    prisma.user.count({
      where: { tenantId: user.tenantId!, role: { not: UserRole.SUPER_ADMIN } },
    }),
    prisma.user.count({
      where: { tenantId: user.tenantId!, role: { not: UserRole.SUPER_ADMIN }, isActive: true },
    }),
    prisma.user.count({
      where: { tenantId: user.tenantId!, role: UserRole.MANAGER },
    }),
    prisma.user.count({
      where: { tenantId: user.tenantId!, role: UserRole.EMPLOYEE },
    }),
  ]);

  const serialized = JSON.parse(JSON.stringify(users));

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage user accounts for your organization."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers} icon={Users} accent="brand" />
        <StatCard label="Active" value={activeUsers} icon={UserCheck} accent="green" />
        <StatCard label="Managers" value={managers} icon={Shield} accent="purple" />
        <StatCard label="Employees" value={employees} icon={User} accent="amber" />
      </div>

      <TenantUsersClient users={serialized} />
    </>
  );
}
