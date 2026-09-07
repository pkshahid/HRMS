import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PayrollActions } from "@/components/payroll/payroll-actions";

export default async function PayrollDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER);

  const [payroll, tenant] = await Promise.all([
    prisma.payroll.findUnique({
      where: { id: params.id },
      include: { items: { include: { employee: true } } },
    }),
    prisma.tenant.findUnique({ where: { id: user.tenantId! } }),
  ]);

  if (!payroll || payroll.tenantId !== user.tenantId) notFound();
  const currency = tenant?.currency || "AED";
  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;

  return (
    <>
      <PageHeader
        title={payroll.name}
        description={`${formatDate(payroll.periodStart)} → ${formatDate(payroll.periodEnd)} · ${payroll.items.length} employees`}
        actions={
          <>
            <Link href="/payroll" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back</Link>
            {canManage && <PayrollActions payrollId={payroll.id} status={payroll.status} />}
          </>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <StatusBadge status={payroll.status} />
        {payroll.payDate && <span className="text-sm text-ink-500">Paid on {formatDate(payroll.payDate)}</span>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Gross" value={formatCurrency(payroll.totalGross, currency)} accent="text-brand-700 bg-brand-50" />
        <SummaryCard label="Total Deductions" value={formatCurrency(payroll.totalDeductions, currency)} accent="text-red-700 bg-red-50" />
        <SummaryCard label="Total Net Pay" value={formatCurrency(payroll.totalNet, currency)} accent="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Employee</th><th>Basic</th><th>Allowances</th><th>Overtime</th><th>Deductions</th><th>Gross</th><th>Net Pay</th><th>Days</th><th></th>
              </tr>
            </thead>
            <tbody>
              {payroll.items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Employee">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                        {initials(`${item.employee.firstName} ${item.employee.lastName}`)}
                      </div>
                      <div>
                        <div className="font-medium text-ink-900">{item.employee.firstName} {item.employee.lastName}</div>
                        <div className="text-xs text-ink-500">{item.employee.employeeCode}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Basic">{formatCurrency(item.basicSalary, currency)}</td>
                  <td data-label="Allowances">{formatCurrency(item.totalAllowances, currency)}</td>
                  <td data-label="Overtime">{formatCurrency(item.overtimeAmount, currency)}</td>
                  <td data-label="Deductions" className="text-red-600">{formatCurrency(item.totalDeductions, currency)}</td>
                  <td data-label="Gross">{formatCurrency(item.grossPay, currency)}</td>
                  <td data-label="Net Pay" className="font-semibold text-ink-900">{formatCurrency(item.netPay, currency)}</td>
                  <td data-label="Days">{item.presentDays}/{item.workingDays}</td>
                  <td>
                    <Link href={`/payroll/${payroll.id}/${item.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                      Payslip
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink-200 bg-ink-50 font-semibold">
                <td>Total</td>
                <td colSpan={4}></td>
                <td>{formatCurrency(payroll.totalGross, currency)}</td>
                <td>{formatCurrency(payroll.totalNet, currency)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 sm:px-5 sm:py-4 ${accent}`}>
      <div className="text-xs font-medium opacity-80 sm:text-sm">{label}</div>
      <div className="mt-1 text-xl font-semibold sm:text-2xl">{value}</div>
    </div>
  );
}
