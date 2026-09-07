import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  PalmtreeIcon,
  Receipt,
  Building2,
  TrendingUp,
  Clock,
  Wallet,
} from "lucide-react";
import { UserRole, LeaveStatus } from "@prisma/client";

export default async function DashboardPage() {
  const user = await requireAuth();

  if (user.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  }
  return <TenantDashboard tenantId={user.tenantId!} currency="AED" role={user.role} />;
}

async function SuperAdminDashboard() {
  const [tenantCount, userCount, employeeCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.employee.count(),
  ]);
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { _count: { select: { employees: true, users: true } } },
  });

  return (
    <>
      <PageHeader title="Super Admin Dashboard" description="Overview of all tenants on the platform." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tenants" value={tenantCount} icon={Building2} accent="brand" />
        <StatCard label="Total Users" value={userCount} icon={Users} accent="green" />
        <StatCard label="Total Employees" value={employeeCount} icon={Users} accent="purple" />
        <StatCard label="Active Tenants" value={tenants.filter((t) => t.status === "active").length} icon={TrendingUp} accent="amber" />
      </div>

      <div className="mt-6 card">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="section-title">Recent Tenants</h2>
          <Link href="/super-admin/tenants" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Organization</th><th>Country</th><th>Plan</th><th>Status</th><th>Employees</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td data-label="Organization" className="font-medium text-ink-900">{t.name}</td>
                  <td data-label="Country">{t.country || "—"}</td>
                  <td data-label="Plan" className="capitalize">{t.plan}</td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                  <td data-label="Employees">{t._count.employees}</td>
                  <td data-label="Created">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

async function TenantDashboard({ tenantId, currency, role }: { tenantId: string; currency: string; role: UserRole }) {
  const [employeeCount, presentToday, pendingLeaves, payrollCount, recentLeaves, recentPayroll] = await Promise.all([
    prisma.employee.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.attendance.count({ where: { tenantId, date: { gte: startOfDay(), lt: endOfDay() }, status: { in: ["PRESENT", "LATE", "REMOTE", "HALF_DAY"] } } }),
    prisma.leaveRequest.count({ where: { tenantId, status: LeaveStatus.PENDING } }),
    prisma.payroll.count({ where: { tenantId } }),
    prisma.leaveRequest.findMany({ where: { tenantId }, include: { employee: true }, orderBy: { appliedAt: "desc" }, take: 5 }),
    prisma.payroll.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const isEmployee = role === UserRole.EMPLOYEE;

  return (
    <>
      <PageHeader
        title={isEmployee ? "My Dashboard" : "Dashboard"}
        description={isEmployee ? "Your attendance, leaves and payslips at a glance." : "Workforce overview for your organization."}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isEmployee ? (
          <>
            <StatCard label="My Status" value="Active" icon={Users} accent="green" />
            <StatCard label="Present Today" value="—" icon={CalendarCheck} accent="brand" />
            <StatCard label="Pending Leaves" value={pendingLeaves} icon={PalmtreeIcon} accent="amber" />
            <StatCard label="My Payslips" value={payrollCount} icon={Receipt} accent="purple" />
          </>
        ) : (
          <>
            <StatCard label="Active Employees" value={employeeCount} icon={Users} accent="brand" />
            <StatCard label="Present Today" value={presentToday} icon={CalendarCheck} accent="green" />
            <StatCard label="Pending Leaves" value={pendingLeaves} icon={PalmtreeIcon} accent="amber" />
            <StatCard label="Payroll Runs" value={payrollCount} icon={Receipt} accent="purple" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="section-title">Recent Leave Requests</h2>
            <Link href={isEmployee ? "/leaves/me" : "/leaves"} className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          <div className="divide-y divide-ink-100">
            {recentLeaves.length === 0 && (
              <div className="px-5 py-8 text-sm text-ink-500">No leave requests yet.</div>
            )}
            {recentLeaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-ink-900">{l.employee.firstName} {l.employee.lastName}</div>
                  <div className="text-xs text-ink-500">{l.type.toLowerCase()} · {formatDate(l.startDate)} → {formatDate(l.endDate)} · {l.totalDays}d</div>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="section-title">Recent Payroll Runs</h2>
            <Link href={isEmployee ? "/payroll/me" : "/payroll"} className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          <div className="divide-y divide-ink-100">
            {recentPayroll.length === 0 && (
              <div className="px-5 py-8 text-sm text-ink-500">No payroll runs yet.</div>
            )}
            {recentPayroll.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-ink-900">{p.name}</div>
                  <div className="text-xs text-ink-500">{formatDate(p.periodStart)} → {formatDate(p.periodEnd)} · {p.itemCount} employees</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-900">{formatCurrency(p.totalNet, currency)}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickLink href="/attendance" icon={Clock} label="Mark Attendance" />
        <QuickLink href="/leaves/apply" icon={PalmtreeIcon} label="Apply for Leave" />
        <QuickLink href="/salary" icon={Wallet} label="Salary Structures" />
      </div>
    </>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-cardhover">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium text-ink-900">{label}</div>
    </Link>
  );
}

function startOfDay() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function endOfDay() {
  const d = new Date(); d.setHours(23, 59, 59, 999); return d;
}
