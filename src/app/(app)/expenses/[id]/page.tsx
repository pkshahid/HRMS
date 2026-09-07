import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ExpenseStatusBadge, CategoryBadge } from "@/components/expenses/expense-ui";
import { ExpenseActions } from "@/components/expenses/expense-actions";

export default async function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();

  const claim = await prisma.expenseClaim.findUnique({
    where: { id: params.id },
    include: { employee: true, approver: true, items: true },
  });

  if (!claim || claim.tenantId !== user.tenantId) notFound();
  if (user.role === UserRole.EMPLOYEE && claim.employeeId !== user.employeeId) notFound();

  const canManage = ([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role);
  const fullName = `${claim.employee.firstName} ${claim.employee.lastName}`;

  return (
    <>
      <PageHeader
        title={claim.title}
        description={`${claim.employee.employeeCode} · Submitted ${formatDate(claim.submittedAt || claim.createdAt)}`}
        actions={
          <Link href="/expenses" className="btn-secondary">
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
              <div className="text-sm text-ink-500">{claim.employee.designation || "—"}</div>
              <div className="mt-3">
                <ExpenseStatusBadge status={claim.status} />
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Total Amount</span>
                <span className="font-semibold text-ink-900">{formatCurrency(claim.totalAmount, claim.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Items</span>
                <span className="text-ink-800">{claim.items.length}</span>
              </div>
              {claim.periodStart && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Period</span>
                  <span className="text-ink-800">
                    {formatDate(claim.periodStart)} → {claim.periodEnd ? formatDate(claim.periodEnd) : "—"}
                  </span>
                </div>
              )}
              {claim.approver && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Approver</span>
                  <span className="text-ink-800">{claim.approver.firstName} {claim.approver.lastName}</span>
                </div>
              )}
              {claim.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Approved</span>
                  <span className="text-ink-800">{formatDate(claim.approvedAt)}</span>
                </div>
              )}
              {claim.paidAt && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Paid</span>
                  <span className="text-ink-800">{formatDate(claim.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {claim.description && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-900">Description</h3>
              <p className="mt-2 text-sm text-ink-600">{claim.description}</p>
            </div>
          )}

          {claim.rejectReason && (
            <div className="card border-red-200 p-5">
              <h3 className="text-sm font-semibold text-red-900">Rejection Reason</h3>
              <p className="mt-2 text-sm text-red-700">{claim.rejectReason}</p>
            </div>
          )}

          {canManage && (claim.status === "SUBMITTED" || claim.status === "APPROVED") && (
            <ExpenseActions claimId={claim.id} status={claim.status} />
          )}
        </div>

        {/* right: items */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h2 className="section-title">Expense Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {claim.items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Category"><CategoryBadge category={item.category} /></td>
                      <td data-label="Description" className="font-medium text-ink-900">{item.description}</td>
                      <td data-label="Date">{formatDate(item.date)}</td>
                      <td data-label="Amount" className="font-semibold text-ink-900">{formatCurrency(item.amount, claim.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-ink-200 bg-ink-50 font-semibold">
                    <td>Total</td>
                    <td colSpan={2}></td>
                    <td>{formatCurrency(claim.totalAmount, claim.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
