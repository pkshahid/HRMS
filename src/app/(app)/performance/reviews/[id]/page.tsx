import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { PerfStatusBadge, RatingStars, ProgressBar } from "@/components/performance/perf-ui";
import { formatDate, initials } from "@/lib/utils";
import { UserRole, ReviewStatus } from "@prisma/client";
import { ArrowLeft, Star, Target, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SelfReviewForm } from "@/components/performance/self-review-form";
import { ManagerReviewForm } from "@/components/performance/manager-review-form";

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();

  const review = await prisma.performanceReview.findUnique({
    where: { id: params.id },
    include: {
      employee: true,
      reviewer: true,
      cycle: true,
      feedback: { include: { fromEmployee: true } },
    },
  });

  if (!review || review.tenantId !== user.tenantId) notFound();

  const isEmployee = review.employeeId === user.employeeId;
  const isReviewer = review.reviewerId === user.employeeId;
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;
  const canSubmitSelf = isEmployee && !review.selfSubmittedAt;
  const canSubmitManager = (isReviewer || isAdmin) && review.status !== ReviewStatus.COMPLETED && review.status !== ReviewStatus.CANCELLED;

  const goals = await prisma.performanceGoal.findMany({
    where: { employeeId: review.employeeId, cycleId: review.cycleId },
  });

  const competencies = (review.cycle.competencies as any[]) || [];
  const competencyScores = (review.competencyScores as any[]) || [];
  const maxRating = review.cycle.ratingScale === "percent" ? 100 : Number(review.cycle.ratingScale);

  return (
    <>
      <Link href="/performance/reviews" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> All reviews
      </Link>

      <PageHeader
        title={`${review.employee.firstName} ${review.employee.lastName}`}
        description={`${review.cycle.name} · Reviewer: ${review.reviewer.firstName} ${review.reviewer.lastName}`}
        actions={<PerfStatusBadge status={review.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Self Assessment */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Star className="h-4 w-4 text-brand-600" /> Self-Assessment
              </h3>
              {review.selfSubmittedAt && (
                <span className="text-xs text-ink-500">Submitted {formatDate(review.selfSubmittedAt)}</span>
              )}
            </div>

            {review.selfSubmittedAt ? (
              <SelfAssessmentView rating={review.selfRating} max={maxRating} data={review} />
            ) : canSubmitSelf ? (
              <SelfReviewForm reviewId={review.id} maxRating={maxRating} />
            ) : (
              <p className="text-sm text-ink-500">Self-assessment not yet submitted.</p>
            )}
          </div>

          {/* Manager Assessment */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Star className="h-4 w-4 text-amber-600" /> Manager Assessment
              </h3>
              {review.managerSubmittedAt && (
                <span className="text-xs text-ink-500">Submitted {formatDate(review.managerSubmittedAt)}</span>
              )}
            </div>

            {review.managerSubmittedAt ? (
              <ManagerAssessmentView rating={review.managerRating} max={maxRating} data={review} competencies={competencies} competencyScores={competencyScores} />
            ) : canSubmitManager ? (
              <ManagerReviewForm reviewId={review.id} maxRating={maxRating} competencies={competencies} />
            ) : (
              <p className="text-sm text-ink-500">Manager assessment not yet submitted.</p>
            )}
          </div>

          {/* 360 Feedback */}
          {review.feedback.length > 0 && (
            <div className="card p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <MessageSquare className="h-4 w-4 text-purple-600" /> 360° Feedback ({review.feedback.length})
              </h3>
              <div className="space-y-3">
                {review.feedback.map((f) => (
                  <div key={f.id} className="rounded-lg border border-ink-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-ink-800">
                        {f.isAnonymous ? "Anonymous" : `${f.fromEmployee.firstName} ${f.fromEmployee.lastName}`}
                      </div>
                      {f.rating && <RatingStars rating={f.rating} max={maxRating} />}
                    </div>
                    {f.strengths && <div className="mt-2 text-xs text-ink-600"><span className="font-semibold">Strengths:</span> {f.strengths}</div>}
                    {f.improvements && <div className="mt-1 text-xs text-ink-600"><span className="font-semibold">Improvements:</span> {f.improvements}</div>}
                    {f.comments && <div className="mt-1 text-xs text-ink-500">{f.comments}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee info */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Employee</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {initials(`${review.employee.firstName} ${review.employee.lastName}`)}
              </div>
              <div>
                <div className="text-sm font-medium text-ink-900">{review.employee.firstName} {review.employee.lastName}</div>
                <div className="text-xs text-ink-500">{review.employee.designation || "—"}</div>
                <div className="text-xs text-ink-500">{review.employee.employeeCode}</div>
              </div>
            </div>
            <Link href={`/employees/${review.employee.id}`} className="mt-3 inline-block text-xs font-medium text-brand-600 hover:text-brand-700">
              View full profile →
            </Link>
          </div>

          {/* Goals */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Target className="h-4 w-4 text-emerald-600" /> Goals ({goals.length})
            </h3>
            <div className="space-y-3">
              {goals.length === 0 && <p className="text-xs text-ink-500">No goals set for this cycle.</p>}
              {goals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-ink-800">{g.title}</div>
                    <PerfStatusBadge status={g.status} />
                  </div>
                  <div className="mt-1"><ProgressBar value={g.progress} /></div>
                  {g.targetValue && (
                    <div className="mt-1 text-xs text-ink-500">Target: {g.targetValue} · Actual: {g.actualValue || "—"}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final outcome */}
          {review.status === ReviewStatus.COMPLETED && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-ink-900">Final Outcome</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Final Rating</span>
                  <RatingStars rating={review.finalRating} max={maxRating} />
                </div>
                {review.recommendations && (
                  <div><span className="text-ink-500">Recommendation:</span> <span className="text-ink-800">{review.recommendations}</span></div>
                )}
                {review.finalComments && (
                  <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-600">{review.finalComments}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SelfAssessmentView({ rating, max, data }: { rating: number | null; max: number; data: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-500">Overall self-rating</span>
        <RatingStars rating={rating} max={max} />
      </div>
      <Field label="Key achievements" value={data.selfAchievements} />
      <Field label="Strengths" value={data.selfStrengths} />
      <Field label="Areas for improvement" value={data.selfImprovements} />
      <Field label="Additional comments" value={data.selfComments} />
    </div>
  );
}

function ManagerAssessmentView({ rating, max, data, competencies: _competencies, competencyScores }: { rating: number | null; max: number; data: any; competencies: any[]; competencyScores: any[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-500">Overall manager rating</span>
        <RatingStars rating={rating} max={max} />
      </div>

      {competencyScores.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Competency Scores</div>
          <div className="space-y-1.5">
            {competencyScores.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">{c.name}</span>
                <RatingStars rating={c.score} max={max} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Field label="Key achievements" value={data.managerAchievements} />
      <Field label="Strengths" value={data.managerStrengths} />
      <Field label="Areas for improvement" value={data.managerImprovements} />
      <Field label="Comments" value={data.managerComments} />
      {data.recommendations && <Field label="Recommendations" value={data.recommendations} />}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 text-sm text-ink-700 whitespace-pre-wrap">{value}</div>
    </div>
  );
}
