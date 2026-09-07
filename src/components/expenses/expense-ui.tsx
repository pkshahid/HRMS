import { ExpenseStatus, AdvanceStatus, ExpenseCategory, AdvanceType } from "@prisma/client";

const expenseStatusStyles: Record<ExpenseStatus, string> = {
  DRAFT: "bg-ink-100 text-ink-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  PAID: "bg-brand-50 text-brand-700",
  CANCELLED: "bg-ink-100 text-ink-400",
};

const advanceStatusStyles: Record<AdvanceStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  DISBURSED: "bg-brand-50 text-brand-700",
  RECOVERING: "bg-purple-50 text-purple-700",
  RECOVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-ink-100 text-ink-400",
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span className={`badge ${expenseStatusStyles[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function AdvanceStatusBadge({ status }: { status: AdvanceStatus }) {
  const labels: Record<AdvanceStatus, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    DISBURSED: "Disbursed",
    RECOVERING: "Recovering",
    RECOVERED: "Recovered",
    CANCELLED: "Cancelled",
  };
  return <span className={`badge ${advanceStatusStyles[status]}`}>{labels[status]}</span>;
}

export function CategoryBadge({ category }: { category: ExpenseCategory }) {
  const labels: Record<ExpenseCategory, string> = {
    TRAVEL: "Travel",
    MEALS: "Meals",
    ACCOMMODATION: "Accommodation",
    TRANSPORT: "Transport",
    EQUIPMENT: "Equipment",
    TRAINING: "Training",
    MEDICAL: "Medical",
    OFFICE_SUPPLIES: "Office Supplies",
    COMMUNICATION: "Communication",
    MISC: "Misc",
  };
  return <span className="badge bg-ink-100 text-ink-600">{labels[category]}</span>;
}

export function AdvanceTypeBadge({ type }: { type: AdvanceType }) {
  const labels: Record<AdvanceType, string> = {
    SALARY_ADVANCE: "Salary Advance",
    LOAN: "Loan",
    PETTY_CASH: "Petty Cash",
    RELOCATION: "Relocation",
    MEDICAL: "Medical",
    OTHER: "Other",
  };
  return <span className="badge bg-brand-50 text-brand-700">{labels[type]}</span>;
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className="h-full rounded-full bg-brand-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
