"use client";

import { useState } from "react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreditCard, Plane, IdCard, Wallet, FileText } from "lucide-react";
import Link from "next/link";
import {
  ExpenseStatusBadge,
  AdvanceStatusBadge,
  AdvanceTypeBadge,
  ProgressBar,
} from "@/components/expenses/expense-ui";

type Employee = any;
type Attendance = any;
type Leave = any;
type SalaryStructure = any;
type ExpenseClaim = any;
type AdvancePayment = any;

export function EmployeeDetailTabs({
  employee,
  attendances,
  leaves,
  salaryStructure,
  currency,
  canEdit,
  expenses,
  advances,
}: {
  employee: Employee;
  attendances: Attendance[];
  leaves: Leave[];
  salaryStructure: SalaryStructure | null;
  currency: string;
  canEdit: boolean;
  expenses?: ExpenseClaim[];
  advances?: AdvancePayment[];
}) {
  const [tab, setTab] = useState<"identity" | "documents" | "attendance" | "leaves" | "salary" | "expenses" | "advances">("identity");

  const tabs = [
    { id: "identity", label: "Identity & Immigration" },
    { id: "documents", label: "Documents" },
    { id: "attendance", label: "Attendance" },
    { id: "leaves", label: "Leaves" },
    { id: "salary", label: "Salary" },
    { id: "expenses", label: "Expenses" },
    { id: "advances", label: "Advances" },
  ] as const;

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-1 overflow-x-auto border-b border-ink-100 px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              tab === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "identity" && <IdentityTab employee={employee} />}
        {tab === "documents" && <DocumentsTab employee={employee} />}
        {tab === "attendance" && <AttendanceTab attendances={attendances} />}
        {tab === "leaves" && <LeavesTab leaves={leaves} />}
        {tab === "salary" && <SalaryTab salaryStructure={salaryStructure} currency={currency} canEdit={canEdit} employeeId={employee.id} />}
        {tab === "expenses" && <ExpensesTab expenses={expenses || []} />}
        {tab === "advances" && <AdvancesTab advances={advances || []} />}
      </div>
    </div>
  );
}

function Group({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      </div>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-sm text-ink-800">{value || "—"}</div>
    </div>
  );
}

function IdentityTab({ employee }: { employee: Employee }) {
  return (
    <>
      <Group title="Passport" icon={IdCard}>
        <Item label="Passport number" value={employee.passportNumber} />
        <Item label="Passport expiry" value={employee.passportExpiry ? formatDate(employee.passportExpiry) : null} />
        <Item label="National ID" value={employee.nationalIdNumber} />
      </Group>
      <Group title="Visa" icon={Plane}>
        <Item label="Visa number" value={employee.visaNumber} />
        <Item label="Visa type" value={employee.visaType} />
        <Item label="Visa expiry" value={employee.visaExpiry ? formatDate(employee.visaExpiry) : null} />
      </Group>
      <Group title="Emirates ID (UAE)" icon={IdCard}>
        <Item label="Emirates ID number" value={employee.emiratesIdNumber} />
        <Item label="Emirates ID expiry" value={employee.emiratesIdExpiry ? formatDate(employee.emiratesIdExpiry) : null} />
      </Group>
      <Group title="Iqama (KSA)" icon={IdCard}>
        <Item label="Iqama number" value={employee.iqamaNumber} />
        <Item label="Iqama expiry" value={employee.iqamaExpiry ? formatDate(employee.iqamaExpiry) : null} />
      </Group>
      <Group title="Work Permit" icon={FileText}>
        <Item label="Work permit number" value={employee.workPermitNumber} />
        <Item label="Work permit expiry" value={employee.workPermitExpiry ? formatDate(employee.workPermitExpiry) : null} />
      </Group>
      <Group title="Bank" icon={Wallet}>
        <Item label="Bank name" value={employee.bankName} />
        <Item label="Account number" value={employee.bankAccountNumber} />
        <Item label="IBAN" value={employee.bankIban} />
        <Item label="SWIFT" value={employee.bankSwift} />
      </Group>
      <Group title="Address" icon={CreditCard}>
        <Item label="Address line 1" value={employee.addressLine1} />
        <Item label="Address line 2" value={employee.addressLine2} />
        <Item label="City" value={employee.city} />
        <Item label="State / Emirate" value={employee.state} />
        <Item label="Country" value={employee.country} />
        <Item label="Postal code" value={employee.postalCode} />
      </Group>
    </>
  );
}

function DocumentsTab({ employee }: { employee: Employee }) {
  const docs = employee.documents || [];
  if (docs.length === 0) {
    return <div className="py-8 text-center text-sm text-ink-500">No documents uploaded yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead><tr><th>Type</th><th>Title</th><th>Number</th><th>Issued</th><th>Expiry</th></tr></thead>
        <tbody>
          {docs.map((d: any) => (
            <tr key={d.id}>
              <td data-label="Type" className="capitalize">{d.type.toLowerCase().replace("_", " ")}</td>
              <td data-label="Title" className="font-medium text-ink-900">{d.title}</td>
              <td data-label="Number">{d.fileNumber || "—"}</td>
              <td data-label="Issued">{d.issuedDate ? formatDate(d.issuedDate) : "—"}</td>
              <td data-label="Expiry">{d.expiryDate ? formatDate(d.expiryDate) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttendanceTab({ attendances }: { attendances: Attendance[] }) {
  if (attendances.length === 0) return <div className="py-8 text-center text-sm text-ink-500">No attendance records.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
        <tbody>
          {attendances.map((a: any) => (
            <tr key={a.id}>
              <td data-label="Date">{formatDate(a.date)}</td>
              <td data-label="Check In">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
              <td data-label="Check Out">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
              <td data-label="Hours">{a.workHours ? `${a.workHours}h` : "—"}</td>
              <td data-label="Status"><StatusBadge status={a.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeavesTab({ leaves }: { leaves: Leave[] }) {
  if (leaves.length === 0) return <div className="py-8 text-center text-sm text-ink-500">No leave requests.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead><tr><th>Type</th><th>Period</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>
          {leaves.map((l: any) => (
            <tr key={l.id}>
              <td data-label="Type" className="capitalize">{l.type.toLowerCase()}</td>
              <td data-label="Period">{formatDate(l.startDate)} → {formatDate(l.endDate)}</td>
              <td data-label="Days">{l.totalDays}</td>
              <td data-label="Reason" className="max-w-[200px] truncate">{l.reason || "—"}</td>
              <td data-label="Status"><StatusBadge status={l.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalaryTab({ salaryStructure, currency, canEdit, employeeId }: { salaryStructure: SalaryStructure | null; currency: string; canEdit: boolean; employeeId: string }) {
  if (!salaryStructure) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-ink-500">No salary structure configured.</p>
        {canEdit && <Link href={`/salary?employee=${employeeId}`} className="btn-primary mt-3">Configure Salary</Link>}
      </div>
    );
  }
  const gross =
    Number(salaryStructure.basicSalary) +
    Number(salaryStructure.housingAllowance) +
    Number(salaryStructure.transportAllowance) +
    Number(salaryStructure.foodAllowance) +
    Number(salaryStructure.otherAllowance);
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SalaryItem label="Basic Salary" value={formatCurrency(salaryStructure.basicSalary, currency)} />
        <SalaryItem label="Housing Allowance" value={formatCurrency(salaryStructure.housingAllowance, currency)} />
        <SalaryItem label="Transport Allowance" value={formatCurrency(salaryStructure.transportAllowance, currency)} />
        <SalaryItem label="Food Allowance" value={formatCurrency(salaryStructure.foodAllowance, currency)} />
        <SalaryItem label="Other Allowance" value={formatCurrency(salaryStructure.otherAllowance, currency)} />
        <SalaryItem label="Overtime Rate / hr" value={formatCurrency(salaryStructure.overtimeRate, currency)} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
        <span className="text-sm font-medium text-brand-700">Gross Monthly</span>
        <span className="text-lg font-semibold text-brand-700">{formatCurrency(gross, currency)}</span>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <SalaryItem label="Tax Rate" value={`${salaryStructure.taxRate}%`} />
        <SalaryItem label="Insurance Rate" value={`${salaryStructure.insuranceRate}%`} />
      </div>
      {canEdit && <Link href={`/salary?employee=${employeeId}`} className="btn-secondary mt-4">Edit Salary Structure</Link>}
    </div>
  );
}

function SalaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-100 p-3">
      <div className="text-xs text-ink-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink-900">{value}</div>
    </div>
  );
}

function ExpensesTab({ expenses }: { expenses: ExpenseClaim[] }) {
  if (expenses.length === 0) {
    return <div className="py-8 text-center text-sm text-ink-500">No expense claims.</div>;
  }
  return (
    <div className="space-y-3">
      {expenses.map((c: any) => (
        <Link
          key={c.id}
          href={`/expenses/${c.id}`}
          className="block rounded-lg border border-ink-100 p-3 transition-colors hover:bg-ink-50"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-medium text-ink-900">{c.title}</div>
              <div className="text-xs text-ink-500">{formatDate(c.createdAt)}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-ink-900">{formatCurrency(c.totalAmount, c.currency)}</span>
              <ExpenseStatusBadge status={c.status} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AdvancesTab({ advances }: { advances: AdvancePayment[] }) {
  if (advances.length === 0) {
    return <div className="py-8 text-center text-sm text-ink-500">No advance payments.</div>;
  }
  return (
    <div className="space-y-3">
      {advances.map((a: any) => (
        <Link
          key={a.id}
          href={`/advances/${a.id}`}
          className="block rounded-lg border border-ink-100 p-3 transition-colors hover:bg-ink-50"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <AdvanceTypeBadge type={a.type} />
                <span className="text-xs text-ink-400">{formatDate(a.requestDate)}</span>
              </div>
              <div className="mt-1 text-sm text-ink-600">{a.reason || "—"}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-ink-900">{formatCurrency(a.amount, a.currency)}</span>
              <AdvanceStatusBadge status={a.status} />
            </div>
          </div>
          {(a.status === "RECOVERING" || a.status === "DISBURSED") && (
            <div className="mt-2">
              <ProgressBar value={Number(a.recoveredAmount)} max={Number(a.amount)} />
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
