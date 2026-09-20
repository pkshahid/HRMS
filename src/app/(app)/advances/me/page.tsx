import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdvanceStatus } from "@prisma/client";
import Link from "next/link";
import { HandCoins, Clock, TrendingUp, Wallet } from "lucide-react";
import { AdvanceStatusBadge, AdvanceTypeBadge, ProgressBar } from "@/components/expenses/expense-ui";
import { normalizeCurrency } from "@/lib/currency";

export default async function MyAdvancesPage() {
  const user = await requireAuth();

  if (!user.employeeId) {
    return (
      <>
        <PageHeader title="My Advances" description="Your advance payment requests." />
        <div className="card p-6 text-sm text-ink-500">
          You don&apos;t have an employee profile linked to your account.
        </div>
      </>
    );
  }

  const [advances, pending, active, totalRemaining] = await Promise.all([
    prisma.advancePayment.findMany({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId },
      include: { approver: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.advancePayment.count({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId, status: AdvanceStatus.PENDING },
    }),
    prisma.advancePayment.count({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId, status: AdvanceStatus.RECOVERING },
    }),
    prisma.advancePayment.aggregate({
      where: { tenantId: user.tenantId!, employeeId: user.employeeId, status: AdvanceStatus.RECOVERING },
      _sum: { remainingAmount: true },
    }),
  ]);

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! }, select: { currency: true } });
  const currency = normalizeCurrency(tenant?.currency);

  return (
    <>
      <PageHeader
        title="My Advances"
        description="Track your salary advances, loans, and petty cash."
        actions={
          <Link href="/advances/request" className="btn-primary">
            <HandCoins className="h-4 w-4" /> Request Advance
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={advances.length} icon={HandCoins} accent="brand" />
        <StatCard label="Pending" value={pending} icon={Clock} accent="amber" />
        <StatCard label="Active" value={active} icon={TrendingUp} accent="purple" />
        <StatCard label="Outstanding" value={formatCurrency(totalRemaining._sum.remainingAmount || 0, currency)} icon={Wallet} accent="red" />
      </div>

      {advances.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <HandCoins className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-ink-900">No advance requests</h3>
          <p className="mt-1 text-sm text-ink-500">Submit a request for a salary advance or loan.</p>
          <Link href="/advances/request" className="btn-primary mt-4">
            <HandCoins className="h-4 w-4" /> Request Advance
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {advances.map((a) => {
            return (
              <Link
                key={a.id}
                href={`/advances/${a.id}`}
                className="card block p-4 transition-shadow hover:shadow-cardhover"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AdvanceTypeBadge type={a.type} />
                      <span className="text-xs text-ink-400">{formatDate(a.requestDate)}</span>
                    </div>
                    <div className="mt-1 text-sm text-ink-600">{a.reason || "—"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-ink-900">{formatCurrency(a.amount, a.currency)}</div>
                      <div className="text-xs text-ink-400">
                        {a.installments} × {formatCurrency(a.installmentAmount, a.currency)}
                      </div>
                    </div>
                    <AdvanceStatusBadge status={a.status} />
                  </div>
                </div>
                {(a.status === "RECOVERING" || a.status === "DISBURSED") && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-ink-500">
                      <span>Recovered: {formatCurrency(a.recoveredAmount, a.currency)}</span>
                      <span>Remaining: {formatCurrency(a.remainingAmount, a.currency)}</span>
                    </div>
                    <ProgressBar value={Number(a.recoveredAmount)} max={Number(a.amount)} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
