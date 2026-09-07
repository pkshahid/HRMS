import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { PerfStatusBadge, RatingStars, ProgressBar } from "@/components/performance/perf-ui";
import { formatDate, initials } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { ArrowLeft, Calendar, Star, Target } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CycleStatusActions } from "@/components/performance/cycle-status-actions";

export default async function CycleDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: params.id },
    include: {
      reviews: {
        include: { employee: true, reviewer: true },
        orderBy: { createdAt: "asc" },
      },
      goals: {
        include: { employee: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cycle || cycle.tenantId !== user.tenantId) notFound();

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
  const competencies = (cycle.competencies as any[]) || [];

  return (
    <>
      <Link href="/performance/cycles" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> All cycles
      </Link>

      <PageHeader
        title={cycle.name}
        description={`${cycle.type.toLowerCase().replace(/_/g, " ")} · ${formatDate(cycle.periodStart)} → ${formatDate(cycle.periodEnd)}`}
        actions={canManage && <CycleStatusActions cycleId={cycle.id} currentStatus={cycle.status} />}
      />

      <div className="mb-6 flex items-center gap-3">
        <PerfStatusBadge status={cycle.status} />
        <span className="text-sm text-ink-500">Rating scale: 1–{cycle.ratingScale === "percent" ? "100" : cycle.ratingScale}</span>
      </div>

      {/* Review windows */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-700"><Star className="h-4 w-4 text-brand-600" /> Self-Review Window</div>
          <div className="mt-2 text-sm text-ink-600">
            {cycle.selfReviewStart ? `${formatDate(cycle.selfReviewStart)} → ${formatDate(cycle.selfReviewEnd || cycle.selfReviewStart)}` : "Not configured"}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-700"><Calendar className="h-4 w-4 text-amber-600" /> Manager Review Window</div>
          <div className="mt-2 text-sm text-ink-600">
            {cycle.managerReviewStart ? `${formatDate(cycle.managerReviewStart)} → ${formatDate(cycle.managerReviewEnd || cycle.managerReviewStart)}` : "Not configured"}
          </div>
        </div>
      </div>

      {/* Competencies */}
      {competencies.length > 0 && (
        <div className="mb-6 card p-5">
          <h3 className="text-sm font-semibold text-ink-900">Competencies Evaluated</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {competencies.map((c, i) => (
              <div key={i} className="rounded-lg bg-ink-50 p-3">
                <div className="text-sm font-medium text-ink-800">{c.name}</div>
                <div className="text-xs text-ink-500">{c.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Star className="mr-1 inline h-4 w-4" /> Reviews ({cycle.reviews.length})
        </h3>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Employee</th><th>Reviewer</th><th>Self</th><th>Manager</th><th>Final</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {cycle.reviews.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-ink-500">No reviews in this cycle.</td></tr>
                )}
                {cycle.reviews.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Employee">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                          {initials(`${r.employee.firstName} ${r.employee.lastName}`)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-ink-900">{r.employee.firstName} {r.employee.lastName}</div>
                          <div className="text-xs text-ink-500">{r.employee.designation || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Reviewer" className="text-sm text-ink-700">{r.reviewer.firstName} {r.reviewer.lastName}</td>
                    <td data-label="Self"><RatingStars rating={r.selfRating} max={cycle.ratingScale === "percent" ? 100 : Number(cycle.ratingScale)} /></td>
                    <td data-label="Manager"><RatingStars rating={r.managerRating} max={cycle.ratingScale === "percent" ? 100 : Number(cycle.ratingScale)} /></td>
                    <td data-label="Final"><RatingStars rating={r.finalRating} max={cycle.ratingScale === "percent" ? 100 : Number(cycle.ratingScale)} /></td>
                    <td data-label="Status"><PerfStatusBadge status={r.status} /></td>
                    <td>
                      <Link href={`/performance/reviews/${r.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Target className="mr-1 inline h-4 w-4" /> Goals & KPIs ({cycle.goals.length})
        </h3>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Employee</th><th>Goal</th><th>Type</th><th>Progress</th><th>Target</th><th>Actual</th><th>Status</th></tr>
              </thead>
              <tbody>
                {cycle.goals.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-ink-500">No goals linked to this cycle.</td></tr>
                )}
                {cycle.goals.map((g) => (
                  <tr key={g.id}>
                    <td data-label="Employee" className="text-sm text-ink-700">{g.employee.firstName} {g.employee.lastName}</td>
                    <td data-label="Goal" className="text-sm font-medium text-ink-900">{g.title}</td>
                    <td data-label="Type" className="capitalize text-xs text-ink-500">{g.type.toLowerCase()}</td>
                    <td data-label="Progress" className="min-w-[120px]"><ProgressBar value={g.progress} /></td>
                    <td data-label="Target" className="text-sm text-ink-600">{g.targetValue || "—"}</td>
                    <td data-label="Actual" className="text-sm text-ink-600">{g.actualValue || "—"}</td>
                    <td data-label="Status"><PerfStatusBadge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
