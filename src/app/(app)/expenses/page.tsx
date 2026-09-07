import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { ExpenseStatus } from "@prisma/client";
import Link from "next/link";
import { CreditCard, Clock, CheckCircle, DollarSign } from "lucide-react";
import { ExpenseStatusBadge } from "@/components/expenses/expense-ui";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireRole(
    ...(["ADMIN", "MANAGER", "STAFF"] as const)
  );

  const where: any = { tenantId: user.tenantId };
  if (searchParams.status) where.status = searchParams.status;

  const [claims, pending, approved, paid] = await Promise.all([
    prisma.expenseClaim.findMany({
      where,
      include: { employee: true, approver: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expenseClaim.count({
      where: { tenantId: user.tenantId!, status: ExpenseStatus.SUBMITTED },
    }),
    prisma.expenseClaim.count({
      where: { tenantId: user.tenantId!, status: ExpenseStatus.APPROVED },
    }),
    prisma.expenseClaim.aggregate({
      where: { tenantId: user.tenantId!, status: ExpenseStatus.PAID },
      _sum: { totalAmount: true },
    }),
  ]);

  const currency = claims[0]?.currency || "AED";

  return (
    <>
      <PageHeader
        title="Expense Claims"
        description="Review and approve employee expense submissions."
        actions={
          <Link href="/expenses/submit" className="btn-primary">
            <CreditCard className="h-4 w-4" /> Submit Expense
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Claims" value={claims.length} icon={CreditCard} accent="brand" />
        <StatCard label="Pending Approval" value={pending} icon={Clock} accent="amber" />
        <StatCard label="Approved" value={approved} icon={CheckCircle} accent="green" />
        <StatCard label="Total Paid" value={formatCurrency(paid._sum.totalAmount || 0, currency)} icon={DollarSign} accent="purple" />
      </div>

      {claims.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-ink-900">No expense claims</h3>
          <p className="mt-1 text-sm text-ink-500">Expense claims will appear here once submitted.</p>
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
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {initials(`${c.employee.firstName} ${c.employee.lastName}`)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900">{c.title}</div>
                    <div className="text-xs text-ink-500">
                      {c.employee.firstName} {c.employee.lastName} · {c.items.length} item{c.items.length === 1 ? "" : "s"} · {formatDate(c.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-ink-900">{formatCurrency(c.totalAmount, c.currency)}</div>
                    {c.approver && (
                      <div className="text-xs text-ink-400">Approved by {c.approver.firstName} {c.approver.lastName}</div>
                    )}
                  </div>
                  <ExpenseStatusBadge status={c.status} />
                </div>
              </div>
              {c.rejectReason && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <span className="font-medium">Rejected: </span>{c.rejectReason}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
