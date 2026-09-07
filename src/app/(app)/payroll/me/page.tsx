import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { Receipt, Wallet } from "lucide-react";
import Link from "next/link";

export default async function MyPayslipsPage() {
  const user = await requireRole(UserRole.EMPLOYEE);
  if (!user.employeeId) {
    return <div className="card p-6 text-sm text-ink-500">No employee profile linked to your account.</div>;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! } });
  const currency = tenant?.currency || "AED";

  const items = await prisma.payrollItem.findMany({
    where: { employeeId: user.employeeId },
    include: { payroll: true },
    orderBy: { payroll: { periodStart: "desc" } },
  });

  const totalEarned = items.filter((i) => i.payroll.status === "PAID").reduce((s, i) => s + Number(i.netPay), 0);

  return (
    <>
      <PageHeader title="My Payslips" description="Your payroll history and downloadable payslips." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Payslips" value={items.length} icon={Receipt} accent="brand" />
        <StatCard label="Total Earned (Paid)" value={formatCurrency(totalEarned, currency)} icon={Wallet} accent="green" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Period</th><th>Range</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-ink-500">No payslips yet.</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Period" className="font-medium text-ink-900">{item.payroll.name}</td>
                  <td data-label="Range">{formatDate(item.payroll.periodStart)} → {formatDate(item.payroll.periodEnd)}</td>
                  <td data-label="Gross">{formatCurrency(item.grossPay, currency)}</td>
                  <td data-label="Deductions" className="text-red-600">{formatCurrency(item.totalDeductions, currency)}</td>
                  <td data-label="Net Pay" className="font-semibold text-ink-900">{formatCurrency(item.netPay, currency)}</td>
                  <td data-label="Status"><StatusBadge status={item.payroll.status} /></td>
                  <td>
                    <Link href={`/payroll/${item.payrollId}/${item.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">View</Link>
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
