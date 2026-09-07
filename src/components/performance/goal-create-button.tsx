"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";

type Emp = { id: string; name: string };
type Cycle = { id: string; name: string };

export function GoalCreateButton({ employees, cycles }: { employees: Emp[]; cycles: Cycle[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    employeeId: "",
    cycleId: "",
    title: "",
    description: "",
    type: "PERFORMANCE",
    status: "NOT_STARTED",
    progress: 0,
    targetValue: "",
    actualValue: "",
    unit: "",
    weight: 0,
    dueDate: "",
  });

  async function submit() {
    if (!form.employeeId || !form.title) {
      setError("Employee and title are required");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/performance/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cycleId: form.cycleId || null,
        weight: Number(form.weight),
        progress: Number(form.progress),
        dueDate: form.dueDate || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error?._ || "Failed to create goal");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Goal</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-lg card max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Create Goal / KPI</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Employee</label>
                <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                  <option value="">— Select —</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cycle (optional)</label>
                <select className="input" value={form.cycleId} onChange={(e) => setForm({ ...form, cycleId: e.target.value })}>
                  <option value="">— None —</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Goal title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Increase sales by 20%" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="DEVELOPMENT">Development</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="OKR">OKR</option>
                    <option value="KPI">KPI</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="AT_RISK">At Risk</option>
                    <option value="ACHIEVED">Achieved</option>
                    <option value="MISSED">Missed</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Target</label>
                  <input className="input" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} placeholder="e.g. 20%" />
                </div>
                <div>
                  <label className="label">Actual</label>
                  <input className="input" value={form.actualValue} onChange={(e) => setForm({ ...form, actualValue: e.target.value })} placeholder="e.g. 18%" />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. %" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Progress ({form.progress}%)</label>
                  <input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="label">Weight ({form.weight}%)</label>
                  <input type="range" min={0} max={100} value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>

              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={submit} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
