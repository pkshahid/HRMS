import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { PerfStatusBadge, ProgressBar } from "@/components/performance/perf-ui";
import { formatDate } from "@/lib/utils";
import { GoalStatus } from "@prisma/client";
import { Target, CheckCircle, AlertTriangle } from "lucide-react";

export default async function MyGoalsPage() {
  const user = await requireAuth();
  if (!user.employeeId) return <div className="card p-6 text-sm text-ink-500">No employee profile linked.</div>;

  const goals = await prisma.performanceGoal.findMany({
    where: { employeeId: user.employeeId },
    include: { cycle: true },
    orderBy: { createdAt: "desc" },
  });

  const achieved = goals.filter((g) => g.status === GoalStatus.ACHIEVED).length;
  const atRisk = goals.filter((g) => g.status === GoalStatus.AT_RISK).length;

  return (
    <>
      <PageHeader title="My Goals & KPIs" description="Track your performance goals and objectives." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Goals" value={goals.length} icon={Target} accent="brand" />
        <StatCard label="Achieved" value={achieved} icon={CheckCircle} accent="green" />
        <StatCard label="At Risk" value={atRisk} icon={AlertTriangle} accent="amber" />
      </div>

      <div className="space-y-4">
        {goals.length === 0 && (
          <div className="card p-10 text-center text-ink-500">You have no goals assigned yet.</div>
        )}
        {goals.map((g) => (
          <div key={g.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">{g.title}</span>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs capitalize text-ink-500">{g.type.toLowerCase()}</span>
                </div>
                {g.description && <p className="mt-1 text-sm text-ink-600">{g.description}</p>}
                {g.cycle && <p className="mt-1 text-xs text-ink-400">Cycle: {g.cycle.name}</p>}
              </div>
              <PerfStatusBadge status={g.status} />
            </div>

            <div className="mt-4"><ProgressBar value={g.progress} /></div>

            <div className="mt-3 grid gap-2 sm:grid-cols-4 text-xs">
              <div><span className="text-ink-400">Target:</span> <span className="text-ink-700">{g.targetValue || "—"}</span></div>
              <div><span className="text-ink-400">Actual:</span> <span className="text-ink-700">{g.actualValue || "—"}</span></div>
              <div><span className="text-ink-400">Weight:</span> <span className="text-ink-700">{g.weight}%</span></div>
              <div><span className="text-ink-400">Due:</span> <span className="text-ink-700">{g.dueDate ? formatDate(g.dueDate) : "—"}</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
