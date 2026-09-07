import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  AdvanceStatusBadge,
  AdvanceTypeBadge,
  ProgressBar,
} from "@/components/expenses/expense-ui";
import { AdvanceActions } from "@/components/expenses/advance-actions";

export default async function AdvanceDetailPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();

  const advance = await prisma.advancePayment.findUnique({
    where: { id: params.id },
    include: { employee: true, approver: true },
  });

  if (!advance || advance.tenantId !== user.tenantId) notFound();
  if (user.role === UserRole.EMPLOYEE && advance.employeeId !== user.employeeId) notFound();

  const canManage = ([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role);
  const fullName = `${advance.employee.firstName} ${advance.employee.lastName}`;
  const recoveryHistory: { date: string; amount: number; payrollId?: string | null }[] =
    advance.recoveryHistory ? JSON.parse(advance.recoveryHistory as string) : [];

  return (
    <>
      <PageHeader
        title={`${advance.type.replace(/_/g, " ")} — ${fullName}`}
        description={`Requested on ${formatDate(advance.requestDate)}`}
        actions={
          <Link href="/advances" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* left: summary */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
                {initials(fullName)}
              </div>
              <div className="mt-3 font-semibold text-ink-900">{fullName}</div>
              <div className="text-sm text-ink-500">{advance.employee.designation || "—"}</div>
              <div className="mt-3 flex items-center gap-2">
                <AdvanceTypeBadge type={advance.type} />
                <AdvanceStatusBadge status={advance.status} />
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Amount</span>
                <span className="font-semibold text-ink-900">{formatCurrency(advance.amount, advance.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Installments</span>
                <span className="text-ink-800">{advance.installments} × {formatCurrency(advance.installmentAmount, advance.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Monthly Deduction</span>
                <span className="text-ink-800">{formatCurrency(advance.monthlyDeduction, advance.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Recovered</span>
                <span className="text-emerald-700 font-medium">{formatCurrency(advance.recoveredAmount, advance.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Remaining</span>
                <span className="text-amber-700 font-medium">{formatCurrency(advance.remainingAmount, advance.currency)}</span>
              </div>
              {advance.approver && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Approver</span>
                  <span className="text-ink-800">{advance.approver.firstName} {advance.approver.lastName}</span>
                </div>
              )}
              {advance.disburseDate && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Disbursed</span>
                  <span className="text-ink-800">{formatDate(advance.disburseDate)}</span>
                </div>
              )}
              {advance.completedAt && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Completed</span>
                  <span className="text-ink-800">{formatDate(advance.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {advance.reason && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-900">Reason</h3>
              <p className="mt-2 text-sm text-ink-600">{advance.reason}</p>
            </div>
          )}

          {advance.rejectReason && (
            <div className="card border-red-200 p-5">
              <h3 className="text-sm font-semibold text-red-900">Rejection Reason</h3>
              <p className="mt-2 text-sm text-red-700">{advance.rejectReason}</p>
            </div>
          )}

          {canManage && (
            <AdvanceActions
              advanceId={advance.id}
              status={advance.status}
              remainingAmount={Number(advance.remainingAmount)}
              currency={advance.currency}
            />
          )}
        </div>

        {/* right: recovery progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="section-title">Recovery Progress</h2>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-ink-500">
                  {formatCurrency(advance.recoveredAmount, advance.currency)} recovered
                </span>
                <span className="text-ink-500">
                  {formatCurrency(advance.remainingAmount, advance.currency)} remaining
                </span>
              </div>
              <ProgressBar value={Number(advance.recoveredAmount)} max={Number(advance.amount)} />
              <div className="mt-2 text-center text-xs text-ink-400">
                {Number(advance.amount) > 0
                  ? Math.round((Number(advance.recoveredAmount) / Number(advance.amount)) * 100)
                  : 0}
                % recovered
              </div>
            </div>
          </div>

          {recoveryHistory.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-4">
                <h2 className="section-title">Recovery History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recoveryHistory.map((r, idx) => (
                      <tr key={idx}>
                        <td data-label="Date">{formatDate(r.date)}</td>
                        <td data-label="Amount" className="font-semibold text-emerald-700">
                          {formatCurrency(r.amount, advance.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
