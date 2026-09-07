import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { PerfStatusBadge } from "@/components/performance/perf-ui";
import { formatDate } from "@/lib/utils";
import { UserRole, CycleStatus } from "@prisma/client";
import { ClipboardCheck, Star, Target } from "lucide-react";
import Link from "next/link";
import { CycleCreateButton } from "@/components/performance/cycle-create-button";

export default async function CyclesPage() {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const cycles = await prisma.performanceCycle.findMany({
    where: { tenantId: user.tenantId! },
    include: { _count: { select: { reviews: true, goals: true } } },
    orderBy: { createdAt: "desc" },
  });

  const open = cycles.filter((c) => c.status === CycleStatus.OPEN || c.status === CycleStatus.REVIEW_IN_PROGRESS).length;
  const completed = cycles.filter((c) => c.status === CycleStatus.CLOSED).length;
  const totalReviews = cycles.reduce((s, c) => s + c._count.reviews, 0);

  const canCreate = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

  return (
    <>
      <PageHeader
        title="Review Cycles"
        description="Manage performance review cycles for your organization."
        actions={canCreate && <CycleCreateButton />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Cycles" value={cycles.length} icon={ClipboardCheck} accent="brand" />
        <StatCard label="Active" value={open} icon={Star} accent="amber" />
        <StatCard label="Completed" value={completed} icon={ClipboardCheck} accent="green" />
        <StatCard label="Total Reviews" value={totalReviews} icon={Target} accent="purple" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Cycle</th><th>Type</th><th>Period</th><th>Reviews</th><th>Goals</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {cycles.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-ink-500">No review cycles yet. Create one to get started.</td></tr>
              )}
              {cycles.map((c) => (
                <tr key={c.id}>
                  <td data-label="Cycle" className="font-medium text-ink-900">{c.name}</td>
                  <td data-label="Type" className="capitalize">{c.type.toLowerCase().replace(/_/g, " ")}</td>
                  <td data-label="Period">{formatDate(c.periodStart)} → {formatDate(c.periodEnd)}</td>
                  <td data-label="Reviews">{c._count.reviews}</td>
                  <td data-label="Goals">{c._count.goals}</td>
                  <td data-label="Status"><PerfStatusBadge status={c.status} /></td>
                  <td>
                    <Link href={`/performance/cycles/${c.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
