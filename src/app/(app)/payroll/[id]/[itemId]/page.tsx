import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/ui/print-button";
import { normalizeCurrency } from "@/lib/currency";

export default async function PayslipPage({
  params,
}: {
  params: { id: string; itemId: string };
}) {
  const user = await requireAuth();

  const item = await prisma.payrollItem.findUnique({
    where: { id: params.itemId },
    include: { employee: true, payroll: true },
  });

  if (!item || item.tenantId !== user.tenantId) notFound();

  // employees can only view their own payslips
  if (user.role === UserRole.EMPLOYEE && item.employeeId !== user.employeeId) notFound();

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! } });
  const tenantCurrency = normalizeCurrency(tenant?.currency);
  const payrollCurrency = normalizeCurrency(item.payroll.currency, tenantCurrency);
  const currency = normalizeCurrency(item.currency, payrollCurrency);

  const gross = Number(item.grossPay);
  const net = Number(item.netPay);
  const deductions = Number(item.totalDeductions);

  return (
    <>
      <PageHeader
        title="Payslip"
        description={`${item.payroll.name} · ${formatDate(item.payroll.periodStart)} → ${formatDate(item.payroll.periodEnd)}`}
        actions={
          <>
            <Link href={`/payroll/${params.id}`} className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back</Link>
            <PrintButton />
          </>
        }
      />

      <div className="mx-auto max-w-3xl">
        <div className="card overflow-hidden">
          {/* header */}
          <div className="flex items-start justify-between gap-3 border-b border-ink-100 bg-ink-50 px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <div className="text-base font-semibold text-ink-900 sm:text-lg">{tenant?.name || "Company"}</div>
              <div className="text-sm text-ink-500">Payslip · {item.payroll.name}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-ink-500">{currency}</span>
              <StatusBadge status={item.payroll.status} />
            </div>
          </div>

          {/* employee info */}
          <div className="grid gap-4 border-b border-ink-100 px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
            <div>
              <div className="text-xs text-ink-400">Employee</div>
              <div className="font-medium text-ink-900">{item.employee.firstName} {item.employee.lastName}</div>
              <div className="text-sm text-ink-500">{item.employee.designation || "—"}</div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-ink-400">Employee Code</div>
              <div className="font-medium text-ink-900">{item.employee.employeeCode}</div>
              <div className="text-sm text-ink-500">Pay Date: {item.payroll.payDate ? formatDate(item.payroll.payDate) : "—"}</div>
            </div>
          </div>

          {/* earnings & deductions */}
          <div className="grid gap-6 px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-900">Earnings</h3>
              <div className="space-y-2 text-sm">
                <Row label="Basic Salary" value={formatCurrency(item.basicSalary, currency)} />
                <Row label="Total Allowances" value={formatCurrency(item.totalAllowances, currency)} />
                <Row label="Overtime" value={formatCurrency(item.overtimeAmount, currency)} />
                <div className="flex justify-between border-t border-ink-100 pt-2 font-semibold text-ink-900">
                  <span>Gross Pay</span><span>{formatCurrency(gross, currency)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-900">Deductions</h3>
              <div className="space-y-2 text-sm">
                <Row label="Tax" value={formatCurrency(item.taxAmount, currency)} negative />
                <Row label="Insurance" value={formatCurrency(item.insuranceAmount, currency)} negative />
                <div className="flex justify-between border-t border-ink-100 pt-2 font-semibold text-ink-900">
                  <span>Total Deductions</span><span>-{formatCurrency(deductions, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* net pay */}
          <div className="flex flex-col gap-2 bg-brand-600 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="text-sm opacity-80">Net Pay</div>
              <div className="text-xl font-semibold sm:text-2xl">{formatCurrency(net, currency)}</div>
            </div>
            <div className="text-sm opacity-90 sm:text-right">
              <div>Present: {item.presentDays} / {item.workingDays} days</div>
              <div>Leave: {item.leaveDays} days</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-600">{label}</span>
      <span className={negative ? "text-red-600" : "text-ink-900"}>{value}</span>
    </div>
  );
}
