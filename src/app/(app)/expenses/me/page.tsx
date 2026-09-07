import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseStatus } from "@prisma/client";
import Link from "next/link";
import { CreditCard, Clock, CheckCircle, DollarSign } from "lucide-react";
import { ExpenseStatusBadge } from "@/components/expenses/expense-ui";

export default async function MyExpensesPage() {
  const user = await requireAuth();

  if (!user.employeeId) {
    return (
      <>
        <PageHeader title="My Expenses" description="Your expense claims." />
        <div className="card p-6 text-sm text-ink-500">
          You don&apos;t have an employee profile linked to your account.
        </div>
      </>
    );
  }

  const [claims, pending, paid, totalPaid] = await Promise.all([
    prisma.expenseClaim.findMany({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId },
      include: { items: true, approver: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expenseClaim.count({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId, status: ExpenseStatus.SUBMITTED },
    }),
    prisma.expenseClaim.count({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId, status: ExpenseStatus.PAID },
    }),
    prisma.expenseClaim.aggregate({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId, status: ExpenseStatus.PAID },
      _sum: { totalAmount: true },
    }),
  ]);

  const currency = claims[0]?.currency || "AED";

  return (
    <>
      <PageHeader
        title="My Expenses"
        description="Track your submitted expense claims."
        actions={
          <Link href="/expenses/submit" className="btn-primary">
            <CreditCard className="h-4 w-4" /> Submit Expense
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Claims" value={claims.length} icon={CreditCard} accent="brand" />
        <StatCard label="Pending" value={pending} icon={Clock} accent="amber" />
        <StatCard label="Paid" value={paid} icon={CheckCircle} accent="green" />
        <StatCard label="Total Reimbursed" value={formatCurrency(totalPaid._sum.totalAmount || 0, currency)} icon={DollarSign} accent="purple" />
      </div>

      {claims.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-ink-900">No expense claims yet</h3>
          <p className="mt-1 text-sm text-ink-500">Submit your first expense claim to get reimbursed.</p>
          <Link href="/expenses/submit" className="btn-primary mt-4">
            <CreditCard className="h-4 w-4" /> Submit Expense
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <Link
              key={c.id}
              href={`/expenses/${c.id}`}
              className="card block p-4 transition-shadow hover:shadow-cardhover"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-ink-900">{c.title}</div>
                  <div className="text-xs text-ink-500">
                    {c.items.length} item{c.items.length === 1 ? "" : "s"} · {formatDate(c.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-ink-900">{formatCurrency(c.totalAmount, c.currency)}</div>
                    {c.approver && (
                      <div className="text-xs text-ink-400">By {c.approver.firstName} {c.approver.lastName}</div>
                    )}
                  </div>
                  <ExpenseStatusBadge status={c.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
