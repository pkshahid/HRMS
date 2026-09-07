"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initials, formatCurrency } from "@/lib/utils";
import { Wallet, X, Loader2, Save } from "lucide-react";

type Emp = {
  id: string;
  name: string;
  code: string;
  designation?: string | null;
  department: string;
  hasStructure: boolean;
  gross: number | null;
};

export function SalaryListClient({
  employees,
  currency,
  preselectEmployeeId,
}: {
  employees: Emp[];
  currency: string;
  preselectEmployeeId?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Emp | null>(
    preselectEmployeeId ? employees.find((e) => e.id === preselectEmployeeId) || null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    basicSalary: "0",
    housingAllowance: "0",
    transportAllowance: "0",
    foodAllowance: "0",
    otherAllowance: "0",
    overtimeRate: "0",
    taxRate: "0",
    insuranceRate: "0",
  });

  function openEditor(emp: Emp) {
    setEditing(emp);
    setError("");
    // fetch existing via API not needed; default to 0 — admin can fill
    setForm({
      basicSalary: "0", housingAllowance: "0", transportAllowance: "0",
      foodAllowance: "0", otherAllowance: "0", overtimeRate: "0",
      taxRate: "0", insuranceRate: "0",
    });
  }

  async function loadExisting(empId: string) {
    const res = await fetch("/api/salary");
    if (res.ok) {
      const { structures } = await res.json();
      const s = structures.find((x: any) => x.employeeId === empId);
      if (s) {
        setForm({
          basicSalary: String(s.basicSalary),
          housingAllowance: String(s.housingAllowance),
          transportAllowance: String(s.transportAllowance),
          foodAllowance: String(s.foodAllowance),
          otherAllowance: String(s.otherAllowance),
          overtimeRate: String(s.overtimeRate),
          taxRate: String(s.taxRate),
          insuranceRate: String(s.insuranceRate),
        });
      }
    }
  }

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const gross =
    Number(form.basicSalary) + Number(form.housingAllowance) + Number(form.transportAllowance) +
    Number(form.foodAllowance) + Number(form.otherAllowance);

  async function save() {
    if (!editing) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/salary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: editing.id, ...form }),
    });
    setLoading(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else {
      setError("Failed to save salary structure.");
    }
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Gross Monthly</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td data-label="Employee">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">{initials(e.name)}</div>
                      <div>
                        <div className="font-medium text-ink-900">{e.name}</div>
                        <div className="text-xs text-ink-500">{e.code}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Department">{e.department}</td>
                  <td data-label="Designation">{e.designation || "—"}</td>
                  <td data-label="Gross Monthly" className="font-medium text-ink-900">{e.gross !== null ? formatCurrency(e.gross, currency) : "—"}</td>
                  <td data-label="Status">{e.hasStructure ? <span className="badge-green">Configured</span> : <span className="badge-gray">Not set</span>}</td>
                  <td>
                    <button
                      onClick={() => { openEditor(e); loadExisting(e.id); }}
                      className="btn-ghost text-brand-600"
                    >
                      <Wallet className="h-4 w-4" /> {e.hasStructure ? "Edit" : "Configure"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-lg card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Salary Structure</h2>
                <p className="text-sm text-ink-500">{editing.name} · {editing.code}</p>
              </div>
              <button onClick={() => setEditing(null)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Basic salary" value={form.basicSalary} onChange={(v) => set("basicSalary", v)} />
              <Field label="Housing allowance" value={form.housingAllowance} onChange={(v) => set("housingAllowance", v)} />
              <Field label="Transport allowance" value={form.transportAllowance} onChange={(v) => set("transportAllowance", v)} />
              <Field label="Food allowance" value={form.foodAllowance} onChange={(v) => set("foodAllowance", v)} />
              <Field label="Other allowance" value={form.otherAllowance} onChange={(v) => set("otherAllowance", v)} />
              <Field label="Overtime rate /hr" value={form.overtimeRate} onChange={(v) => set("overtimeRate", v)} />
              <Field label="Tax rate (%)" value={form.taxRate} onChange={(v) => set("taxRate", v)} />
              <Field label="Insurance rate (%)" value={form.insuranceRate} onChange={(v) => set("insuranceRate", v)} />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
              <span className="text-sm font-medium text-brand-700">Gross Monthly</span>
              <span className="text-lg font-semibold text-brand-700">{formatCurrency(gross, currency)}</span>
            </div>

            {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button onClick={save} disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" min="0" step="0.01" className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
