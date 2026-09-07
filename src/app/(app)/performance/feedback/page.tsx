import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { RatingStars } from "@/components/performance/perf-ui";
import { initials, formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { MessageSquare, Star, Users } from "lucide-react";
import Link from "next/link";

export default async function FeedbackPage() {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const feedback = await prisma.reviewFeedback.findMany({
    where: { tenantId: user.tenantId! },
    include: { fromEmployee: true, toEmployee: true, cycle: true },
    orderBy: { submittedAt: "desc" },
  });

  const total = feedback.length;
  const avgRating = feedback.length && feedback[0].rating
    ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length).toFixed(1)
    : "—";
  const uniqueReceivers = new Set(feedback.map((f) => f.toEmployeeId)).size;

  return (
    <>
      <PageHeader
        title="360° Feedback"
        description="All peer, manager, and multi-source feedback across cycles."
        actions={<Link href="/performance/feedback/give" className="btn-primary"><MessageSquare className="h-4 w-4" /> Give Feedback</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Feedback" value={total} icon={MessageSquare} accent="brand" />
        <StatCard label="Avg Rating" value={avgRating} icon={Star} accent="amber" />
        <StatCard label="Employees Reviewed" value={uniqueReceivers} icon={Users} accent="purple" />
      </div>

      <div className="space-y-3">
        {feedback.length === 0 && (
          <div className="card p-10 text-center text-ink-500">No feedback submitted yet.</div>
        )}
        {feedback.map((f) => (
          <div key={f.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                  {initials(`${f.toEmployee.firstName} ${f.toEmployee.lastName}`)}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-900">{f.toEmployee.firstName} {f.toEmployee.lastName}</div>
                  <div className="text-xs text-ink-500">
                    {f.isAnonymous ? "Anonymous" : `From ${f.fromEmployee.firstName} ${f.fromEmployee.lastName}`} · {f.type.toLowerCase()} · {formatDate(f.submittedAt)}
                    {f.cycle && ` · ${f.cycle.name}`}
                  </div>
                </div>
              </div>
              <RatingStars rating={f.rating} />
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              {f.strengths && <div className="text-ink-700"><span className="font-semibold text-emerald-700">Strengths:</span> {f.strengths}</div>}
              {f.improvements && <div className="text-ink-700"><span className="font-semibold text-amber-700">Improvements:</span> {f.improvements}</div>}
              {f.comments && <div className="text-ink-600">{f.comments}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
