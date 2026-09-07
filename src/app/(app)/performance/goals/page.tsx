import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { PerfStatusBadge, ProgressBar } from "@/components/performance/perf-ui";
import { initials } from "@/lib/utils";
import { UserRole, GoalStatus } from "@prisma/client";
import { Target, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { GoalCreateButton } from "@/components/performance/goal-create-button";

export default async function GoalsPage() {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const [goals, employees, cycles] = await Promise.all([
    prisma.performanceGoal.findMany({
      where: { tenantId: user.tenantId! },
      include: { employee: true, cycle: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.findMany({ where: { tenantId: user.tenantId!, status: "ACTIVE" }, orderBy: { firstName: "asc" } }),
    prisma.performanceCycle.findMany({ where: { tenantId: user.tenantId! }, orderBy: { createdAt: "desc" } }),
  ]);

  const achieved = goals.filter((g) => g.status === GoalStatus.ACHIEVED).length;
  const atRisk = goals.filter((g) => g.status === GoalStatus.AT_RISK).length;
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  return (
    <>
      <PageHeader
        title="Goals & KPIs"
        description="Track performance goals, OKRs, and KPIs across the organization."
        actions={<GoalCreateButton employees={employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))} cycles={cycles.map((c) => ({ id: c.id, name: c.name }))} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Goals" value={goals.length} icon={Target} accent="brand" />
        <StatCard label="Achieved" value={achieved} icon={CheckCircle} accent="green" />
        <StatCard label="At Risk" value={atRisk} icon={AlertTriangle} accent="amber" />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} accent="purple" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Employee</th><th>Goal</th><th>Type</th><th>Progress</th><th>Target → Actual</th><th>Weight</th><th>Status</th></tr>
            </thead>
            <tbody>
              {goals.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-ink-500">No goals yet. Create one to get started.</td></tr>
              )}
              {goals.map((g) => (
                <tr key={g.id}>
                  <td data-label="Employee">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                        {initials(`${g.employee.firstName} ${g.employee.lastName}`)}
                      </div>
                      <span className="text-sm text-ink-700">{g.employee.firstName} {g.employee.lastName}</span>
                    </div>
                  </td>
                  <td data-label="Goal" className="text-sm font-medium text-ink-900">{g.title}{g.cycle && <span className="ml-2 text-xs text-ink-400">· {g.cycle.name}</span>}</td>
                  <td data-label="Type" className="capitalize text-xs text-ink-500">{g.type.toLowerCase()}</td>
                  <td data-label="Progress" className="min-w-[140px]"><ProgressBar value={g.progress} /></td>
                  <td data-label="Target → Actual" className="text-sm text-ink-600">{g.targetValue || "—"} → {g.actualValue || "—"}</td>
                  <td data-label="Weight" className="text-sm text-ink-600">{g.weight}%</td>
                  <td data-label="Status"><PerfStatusBadge status={g.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
