"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Sparkles } from "lucide-react";

export function PayrollListClient({ mode: _mode }: { mode: "generate" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(lastOfMonth);
  const [name, setName] = useState("");

  async function generate() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodStart, periodEnd, name: name || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      const { payroll } = await res.json();
      setOpen(false);
      router.push(`/payroll/${payroll.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error?._ || "Failed to generate payroll");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" /> Generate Payroll
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-md card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Generate Payroll Run</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Name (optional)</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`${now.toLocaleString("en", { month: "long" })} ${now.getFullYear()}`} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Period start</label>
                  <input type="date" className="input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <label className="label">Period end</label>
                  <input type="date" className="input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                </div>
              </div>
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                This will create a draft payroll with payslips for all active employees with configured salary structures.
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={generate} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
