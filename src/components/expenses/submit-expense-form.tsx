"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { CurrencySelect } from "@/components/ui/currency-select";

type Emp = { id: string; firstName: string; lastName: string; employeeCode: string };

type ItemRow = {
  category: string;
  description: string;
  amount: string;
  date: string;
};

const CATEGORIES = [
  "TRAVEL", "MEALS", "ACCOMMODATION", "TRANSPORT", "EQUIPMENT",
  "TRAINING", "MEDICAL", "OFFICE_SUPPLIES", "COMMUNICATION", "MISC",
];

export function SubmitExpenseForm({
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || "");
  const [currency, setCurrency] = useState(currencyProp);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { category: "MISC", description: "", amount: "", date: new Date().toISOString().split("T")[0] },
  ]);

  function addItem() {
    setItems([...items, { category: "MISC", description: "", amount: "", date: new Date().toISOString().split("T")[0] }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Title is required"); return; }
    if (!employeeId) { setError("Please select an employee"); return; }
    if (items.some((item) => !item.description.trim() || !item.amount || parseFloat(item.amount) <= 0)) {
      setError("All items must have a description and valid amount");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        title,
        description: description || null,
        currency,
        periodStart: periodStart || null,
        periodEnd: periodEnd || null,
        items: items.map((item) => ({
          category: item.category,
          description: item.description,
          amount: parseFloat(item.amount),
          date: item.date,
        })),
      }),
    });
    setLoading(false);

    if (res.ok) {
      const { claim } = await res.json();
      router.push(`/expenses/${claim.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error?._ || data.error || "Failed to submit expense");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="card p-5">
        <h2 className="section-title">Claim Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Client visit — Dubai"
              required
            />
          </div>
          {canChoose && (
            <div>
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
            <label className="label">Period Start</label>
            <input
              type="date"
              className="input"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Period End</label>
            <input
              type="date"
              className="input"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <CurrencySelect value={currency} onChange={setCurrency} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the expense claim..."
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Expense Items</h2>
          <button type="button" onClick={addItem} className="btn-secondary">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-ink-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={item.category}
                    onChange={(e) => updateItem(idx, "category", e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <input
                    className="input"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="What was the expense for?"
                  />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={item.date}
                    onChange={(e) => updateItem(idx, "date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={item.amount}
                    onChange={(e) => updateItem(idx, "amount", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              {items.length > 1 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 inline" /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
          <span className="text-sm font-medium text-ink-500">Total</span>
          <span className="text-lg font-semibold text-ink-900">
            {currency} {total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit Claim
        </button>
      </div>
    </form>
  );
}
