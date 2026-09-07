import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { PerfStatusBadge, RatingStars } from "@/components/performance/perf-ui";
import { initials } from "@/lib/utils";
import { UserRole, ReviewStatus } from "@prisma/client";
import { Star, Clock, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

export default async function ReviewsPage() {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const reviews = await prisma.performanceReview.findMany({
    where: { tenantId: user.tenantId! },
    include: { employee: true, reviewer: true, cycle: true },
    orderBy: { createdAt: "desc" },
  });

  const pending = reviews.filter((r) => r.status === ReviewStatus.SELF_REVIEW_PENDING || r.status === ReviewStatus.MANAGER_REVIEW_PENDING).length;
  const completed = reviews.filter((r) => r.status === ReviewStatus.COMPLETED).length;
  const myAssignments = reviews.filter((r) => r.reviewerId === user.employeeId && r.status !== ReviewStatus.COMPLETED && r.status !== ReviewStatus.CANCELLED).length;

  return (
    <>
      <PageHeader
        title="Performance Reviews"
        description="View and manage all performance reviews across cycles."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Reviews" value={reviews.length} icon={Star} accent="brand" />
        <StatCard label="Pending" value={pending} icon={Clock} accent="amber" />
        <StatCard label="Completed" value={completed} icon={CheckCircle} accent="green" />
        <StatCard label="My Assignments" value={myAssignments} icon={Users} accent="purple" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Employee</th><th>Reviewer</th><th>Cycle</th><th>Self</th><th>Manager</th><th>Final</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {reviews.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-ink-500">No reviews yet. Create a cycle and add reviews.</td></tr>
              )}
              {reviews.map((r) => (
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
                  <td data-label="Cycle" className="text-sm text-ink-600">{r.cycle.name}</td>
                  <td data-label="Self"><RatingStars rating={r.selfRating} /></td>
                  <td data-label="Manager"><RatingStars rating={r.managerRating} /></td>
                  <td data-label="Final"><RatingStars rating={r.finalRating} /></td>
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
    </>
  );
}
