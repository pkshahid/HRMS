import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { AdvanceStatus } from "@prisma/client";
import Link from "next/link";
import { HandCoins, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { AdvanceStatusBadge, AdvanceTypeBadge, ProgressBar } from "@/components/expenses/expense-ui";

export default async function AdvancesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireRole(
    ...(["ADMIN", "MANAGER", "STAFF"] as const)
  );

  const where: any = { tenantId: user.tenantId };
  if (searchParams.status) where.status = searchParams.status;

  const [advances, pending, active, totalOutstanding] = await Promise.all([
    prisma.advancePayment.findMany({
      where,
      include: { employee: true, approver: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.advancePayment.count({
      where: { tenantId: user.tenantId!, status: AdvanceStatus.PENDING },
    }),
    prisma.advancePayment.count({
      where: { tenantId: user.tenantId!, status: AdvanceStatus.RECOVERING },
    }),
    prisma.advancePayment.aggregate({
      where: { tenantId: user.tenantId!, status: { in: [AdvanceStatus.RECOVERING, AdvanceStatus.DISBURSED] } },
      _sum: { remainingAmount: true },
    }),
  ]);

  const currency = advances[0]?.currency || "AED";

  return (
    <>
      <PageHeader
        title="Advance Payments"
        description="Manage salary advances, loans, and petty cash requests."
        actions={
          <Link href="/advances/request" className="btn-primary">
            <HandCoins className="h-4 w-4" /> Request Advance
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Advances" value={advances.length} icon={HandCoins} accent="brand" />
        <StatCard label="Pending Approval" value={pending} icon={Clock} accent="amber" />
        <StatCard label="Active Recovery" value={active} icon={TrendingUp} accent="purple" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding._sum.remainingAmount || 0, currency)} icon={CheckCircle} accent="green" />
      </div>

      {advances.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <HandCoins className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-ink-900">No advance payments</h3>
          <p className="mt-1 text-sm text-ink-500">Advance payment requests will appear here.</p>
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
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {initials(`${a.employee.firstName} ${a.employee.lastName}`)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink-900">
                        {a.employee.firstName} {a.employee.lastName}
                      </div>
                      <div className="text-xs text-ink-500">
                        {a.reason || a.type.replace(/_/g, " ").toLowerCase()} · {formatDate(a.requestDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AdvanceTypeBadge type={a.type} />
                    <div className="text-right">
                      <div className="text-sm font-semibold text-ink-900">{formatCurrency(a.amount, a.currency)}</div>
                      <div className="text-xs text-ink-400">
                        {a.installments} installment{a.installments === 1 ? "" : "s"}
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
