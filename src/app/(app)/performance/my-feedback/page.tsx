import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { RatingStars } from "@/components/performance/perf-ui";
import { formatDate } from "@/lib/utils";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function MyFeedbackPage() {
  const user = await requireAuth();
  if (!user.employeeId) return <div className="card p-6 text-sm text-ink-500">No employee profile linked.</div>;

  const [received, given] = await Promise.all([
    prisma.reviewFeedback.findMany({
      where: { toEmployeeId: user.employeeId },
      include: { fromEmployee: true, cycle: true },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.reviewFeedback.findMany({
      where: { fromEmployeeId: user.employeeId },
      include: { toEmployee: true, cycle: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="My Feedback"
        description="Feedback you've received and given."
        actions={<Link href="/performance/feedback/give" className="btn-primary"><MessageSquare className="h-4 w-4" /> Give Feedback</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Received */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Received ({received.length})</h3>
          <div className="space-y-3">
            {received.length === 0 && <div className="card p-8 text-center text-sm text-ink-500">No feedback received yet.</div>}
            {received.map((f) => (
              <div key={f.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-ink-500">
                    {f.isAnonymous ? "Anonymous" : `${f.fromEmployee.firstName} ${f.fromEmployee.lastName}`} · {f.type.toLowerCase()}
                    {f.cycle && ` · ${f.cycle.name}`}
                  </div>
                  <RatingStars rating={f.rating} />
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {f.strengths && <div className="text-ink-700"><span className="font-semibold text-emerald-700">Strengths:</span> {f.strengths}</div>}
                  {f.improvements && <div className="text-ink-700"><span className="font-semibold text-amber-700">Improvements:</span> {f.improvements}</div>}
                  {f.comments && <div className="text-ink-600">{f.comments}</div>}
                </div>
                <div className="mt-2 text-xs text-ink-400">{formatDate(f.submittedAt)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Given */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Given ({given.length})</h3>
          <div className="space-y-3">
            {given.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-sm text-ink-500">You haven&apos;t given feedback yet.</p>
                <Link href="/performance/feedback/give" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                  Give feedback now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            {given.map((f) => (
              <div key={f.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-ink-500">
                    To {f.toEmployee.firstName} {f.toEmployee.lastName} · {f.type.toLowerCase()}
                    {f.cycle && ` · ${f.cycle.name}`}
                  </div>
                  <RatingStars rating={f.rating} />
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {f.strengths && <div className="text-ink-700"><span className="font-semibold text-emerald-700">Strengths:</span> {f.strengths}</div>}
                  {f.improvements && <div className="text-ink-700"><span className="font-semibold text-amber-700">Improvements:</span> {f.improvements}</div>}
                </div>
                <div className="mt-2 text-xs text-ink-400">{formatDate(f.submittedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
