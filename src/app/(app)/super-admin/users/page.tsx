import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { Users, UserCheck, Shield, Building2 } from "lucide-react";
import { UsersManagementClient } from "@/components/super-admin/users-client";

export default async function UsersPage() {
  await requireRole(UserRole.SUPER_ADMIN);

  const [users, total, active, superAdmins, tenantAdmins] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        isActive: true,
        phone: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, slug: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
  ]);

  const serialized = JSON.parse(JSON.stringify(users));

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage all platform users across all tenants."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={total} icon={Users} accent="brand" />
        <StatCard label="Active" value={active} icon={UserCheck} accent="green" />
        <StatCard label="Super Admins" value={superAdmins} icon={Shield} accent="red" />
        <StatCard label="Tenant Users" value={tenantAdmins} icon={Building2} accent="purple" />
      </div>

      <UsersManagementClient users={serialized} isSuperAdmin={true} />
    </>
  );
}
