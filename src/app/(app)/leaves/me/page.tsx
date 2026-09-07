import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { PalmtreeIcon, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function MyLeavesPage() {
  const user = await requireRole(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.STAFF);
  if (!user.employeeId) {
    return <div className="card p-6 text-sm text-ink-500">No employee profile linked to your account.</div>;
  }

  const [leaves, balances] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { employeeId: user.employeeId },
      orderBy: { appliedAt: "desc" },
    }),
    prisma.leaveBalance.findMany({
      where: { employeeId: user.employeeId, year: new Date().getFullYear() },
    }),
  ]);

  const pending = leaves.filter((l) => l.status === "PENDING").length;
  const approved = leaves.filter((l) => l.status === "APPROVED").length;

  return (
    <>
      <PageHeader
        title="My Leaves"
        description="Your leave requests and balances."
        actions={<Link href="/leaves/apply" className="btn-primary"><PalmtreeIcon className="h-4 w-4" /> Apply Leave</Link>}
      />

      {balances.length > 0 && (
        <div className="card mb-6 p-4">
          <h3 className="text-sm font-semibold text-ink-900">Leave Balances ({new Date().getFullYear()})</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {balances.map((b) => (
              <div key={b.id} className="rounded-lg border border-ink-100 p-3">
                <div className="text-xs capitalize text-ink-400">{b.type.toLowerCase()}</div>
                <div className="mt-1 text-lg font-semibold text-ink-900">{b.entitled - b.used} <span className="text-sm font-normal text-ink-400">/ {b.entitled} days</span></div>
                <div className="text-xs text-ink-500">{b.used} used</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending Requests" value={pending} icon={Clock} accent="amber" />
        <StatCard label="Approved Requests" value={approved} icon={CheckCircle} accent="green" />
      </div>

      <div className="space-y-3">
        {leaves.length === 0 && (
          <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
            <h3 className="text-base font-semibold text-ink-900">No leave requests yet</h3>
            <p className="mt-1 text-sm text-ink-500">Submit your first leave request.</p>
            <Link href="/leaves/apply" className="btn-primary mt-4"><PalmtreeIcon className="h-4 w-4" /> Apply Leave</Link>
          </div>
        )}
        {leaves.map((l) => (
          <div key={l.id} className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-900 capitalize">{l.type.toLowerCase()} Leave</span>
                  <StatusBadge status={l.status} />
                </div>
                <div className="mt-1 text-sm text-ink-500">{formatDate(l.startDate)} → {formatDate(l.endDate)} · {l.totalDays} day{l.totalDays === 1 ? "" : "s"}</div>
              </div>
              <div className="text-xs text-ink-400">Applied {formatDate(l.appliedAt)}</div>
            </div>
            {l.reason && <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">{l.reason}</div>}
            {l.approverNote && <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{l.approverNote}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
