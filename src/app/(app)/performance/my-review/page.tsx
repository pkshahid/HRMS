import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { PerfStatusBadge, RatingStars } from "@/components/performance/perf-ui";
import { formatDate } from "@/lib/utils";
import { ReviewStatus } from "@prisma/client";
import { Star } from "lucide-react";
import Link from "next/link";

export default async function MyReviewPage() {
  const user = await requireAuth();
  if (!user.employeeId) return <div className="card p-6 text-sm text-ink-500">No employee profile linked.</div>;

  const reviews = await prisma.performanceReview.findMany({
    where: { employeeId: user.employeeId },
    include: { cycle: true, reviewer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="My Reviews" description="Your performance reviews and self-assessments." />

      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="card p-10 text-center text-ink-500">You have no reviews assigned yet.</div>
        )}
        {reviews.map((r) => {
          const maxRating = r.cycle.ratingScale === "percent" ? 100 : Number(r.cycle.ratingScale);
          const needsSelf = !r.selfSubmittedAt && r.status !== ReviewStatus.CANCELLED;
          return (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-brand-600" />
                    <span className="text-sm font-semibold text-ink-900">{r.cycle.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    Reviewer: {r.reviewer.firstName} {r.reviewer.lastName} · {formatDate(r.cycle.periodStart)} → {formatDate(r.cycle.periodEnd)}
                  </div>
                </div>
                <PerfStatusBadge status={r.status} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-ink-50 p-3">
                  <div className="text-xs text-ink-500">Self-Assessment</div>
                  <div className="mt-1"><RatingStars rating={r.selfRating} max={maxRating} /></div>
                  {r.selfSubmittedAt && <div className="mt-1 text-xs text-ink-400">Submitted {formatDate(r.selfSubmittedAt)}</div>}
                </div>
                <div className="rounded-lg bg-ink-50 p-3">
                  <div className="text-xs text-ink-500">Manager Assessment</div>
                  <div className="mt-1"><RatingStars rating={r.managerRating} max={maxRating} /></div>
                  {r.managerSubmittedAt && <div className="mt-1 text-xs text-ink-400">Submitted {formatDate(r.managerSubmittedAt)}</div>}
                </div>
                <div className="rounded-lg bg-ink-50 p-3">
                  <div className="text-xs text-ink-500">Final Rating</div>
                  <div className="mt-1"><RatingStars rating={r.finalRating} max={maxRating} /></div>
                  {r.recommendations && <div className="mt-1 text-xs text-ink-600">{r.recommendations}</div>}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link href={`/performance/reviews/${r.id}`} className="btn-secondary text-sm">
                  {needsSelf ? "Complete Self-Assessment" : "View Details"}
                </Link>
                {needsSelf && (
                  <span className="text-xs font-medium text-amber-700">Action needed: submit your self-assessment</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
