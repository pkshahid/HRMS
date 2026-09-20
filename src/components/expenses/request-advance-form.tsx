"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { CurrencySelect } from "@/components/ui/currency-select";

type Emp = { id: string; firstName: string; lastName: string; employeeCode: string };

const TYPES = [
  { value: "SALARY_ADVANCE", label: "Salary Advance" },
  { value: "LOAN", label: "Loan" },
  { value: "PETTY_CASH", label: "Petty Cash" },
  { value: "RELOCATION", label: "Relocation" },
  { value: "MEDICAL", label: "Medical" },
  { value: "OTHER", label: "Other" },
];

export function RequestAdvanceForm({
  employees,
  defaultEmployeeId,
  canChoose,
  currency: currencyProp,
}: {
  employees: Emp[];
  defaultEmployeeId: string | null;
  canChoose: boolean;
  currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || "");
  const [type, setType] = useState("SALARY_ADVANCE");
  const [currency, setCurrency] = useState(currencyProp);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [installments, setInstallments] = useState("1");

  const installmentAmount = (parseFloat(amount) || 0) / (parseInt(installments) || 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!employeeId) { setError("Please select an employee"); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Amount must be positive"); return; }

    setLoading(true);
    const res = await fetch("/api/advances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        type,
        amount: parseFloat(amount),
        reason: reason || null,
        installments: parseInt(installments) || 1,
        currency,
      }),
    });
    setLoading(false);

    if (res.ok) {
      const { advance } = await res.json();
      router.push(`/advances/${advance.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error?._ || data.error || "Failed to submit request");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="card p-5">
        <h2 className="section-title">Request Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {canChoose && (
            <div className="sm:col-span-2">
              <label className="label">Employee <span className="text-red-500">*</span></label>
              <select
                className="input"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <CurrencySelect value={currency} onChange={setCurrency} />
          </div>
          <div>
            <label className="label">Amount ({currency}) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="label">Installments</label>
            <input
              type="number"
              min="1"
              max="60"
              className="input"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Monthly Deduction</label>
            <div className="input bg-ink-50">
              {currency} {installmentAmount.toFixed(2)}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Reason</label>
            <textarea
              className="input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the purpose of this advance..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit Request
        </button>
      </div>
    </form>
  );
}
