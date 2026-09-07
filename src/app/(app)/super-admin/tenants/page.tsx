import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { Building2, Users, TrendingUp } from "lucide-react";
import { TenantsClient } from "@/components/super-admin/tenants-client";

export default async function TenantsPage() {
  await requireRole(UserRole.SUPER_ADMIN);

  const [tenants, totalEmployees, totalUsers] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { employees: true, users: true } } },
    }),
    prisma.employee.count(),
    prisma.user.count({ where: { role: { not: UserRole.SUPER_ADMIN } } }),
  ]);

  const active = tenants.filter((t) => t.status === "active").length;

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage all organizations on the platform."
        actions={<TenantsClient mode="create" />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tenants" value={tenants.length} icon={Building2} accent="brand" />
        <StatCard label="Active" value={active} icon={TrendingUp} accent="green" />
        <StatCard label="Total Employees" value={totalEmployees} icon={Users} accent="purple" />
        <StatCard label="Total Users" value={totalUsers} icon={Users} accent="amber" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Organization</th><th>Slug</th><th>Country</th><th>Plan</th><th>Status</th><th>Employees</th><th>Users</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td data-label="Organization" className="font-medium text-ink-900">{t.name}</td>
                  <td data-label="Slug" className="font-mono text-xs text-ink-500">{t.slug}</td>
                  <td data-label="Country">{t.country || "—"}</td>
                  <td data-label="Plan" className="capitalize"><span className="badge-blue">{t.plan}</span></td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                  <td data-label="Employees">{t._count.employees}</td>
                  <td data-label="Users">{t._count.users}</td>
                  <td data-label="Created">{formatDate(t.createdAt)}</td>
                  <td><TenantsClient mode="row" tenant={JSON.parse(JSON.stringify(t))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
