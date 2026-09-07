import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { Receipt, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PayrollListClient } from "@/components/payroll/payroll-list-client";

export default async function PayrollPage() {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER);
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! } });
  const currency = tenant?.currency || "AED";

  const payrolls = await prisma.payroll.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  const totalPaid = payrolls.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.totalNet), 0);
  const totalGross = payrolls.reduce((s, p) => s + Number(p.totalGross), 0);
  const draftCount = payrolls.filter((p) => p.status === "DRAFT").length;

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;

  return (
    <>
      <PageHeader
        title="Payroll Runs"
        description="Generate and manage payroll runs for your organization."
        actions={canManage && <PayrollListClient mode="generate" />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Runs" value={payrolls.length} icon={Receipt} accent="brand" />
        <StatCard label="Total Gross" value={formatCurrency(totalGross, currency)} icon={TrendingUp} accent="green" />
        <StatCard label="Total Paid" value={formatCurrency(totalPaid, currency)} icon={Wallet} accent="purple" />
        <StatCard label="Draft Runs" value={draftCount} icon={TrendingDown} accent="amber" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Period</th><th>Period Range</th><th>Employees</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {payrolls.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-ink-500">No payroll runs yet. Click &quot;Generate Payroll&quot; to create one.</td></tr>
              )}
              {payrolls.map((p) => (
                <tr key={p.id}>
                  <td data-label="Period" className="font-medium text-ink-900">{p.name}</td>
                  <td data-label="Period Range">{formatDate(p.periodStart)} → {formatDate(p.periodEnd)}</td>
                  <td data-label="Employees">{p._count.items}</td>
                  <td data-label="Gross">{formatCurrency(p.totalGross, currency)}</td>
                  <td data-label="Deductions" className="text-red-600">{formatCurrency(p.totalDeductions, currency)}</td>
                  <td data-label="Net Pay" className="font-semibold text-ink-900">{formatCurrency(p.totalNet, currency)}</td>
                  <td data-label="Status"><StatusBadge status={p.status} /></td>
                  <td>
                    <Link href={`/payroll/${p.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">View</Link>
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
