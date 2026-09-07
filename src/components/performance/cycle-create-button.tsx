"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Sparkles } from "lucide-react";

const DEFAULT_COMPETENCIES = [
  { name: "Job Knowledge", description: "Demonstrates understanding of role and responsibilities" },
  { name: "Quality of Work", description: "Produces accurate, thorough, high-quality output" },
  { name: "Productivity", description: "Completes work efficiently and meets deadlines" },
  { name: "Teamwork", description: "Collaborates effectively with colleagues" },
  { name: "Communication", description: "Communicates clearly and professionally" },
  { name: "Initiative", description: "Takes proactive action and shows ownership" },
];

export function CycleCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  const now = new Date();
  const year = now.getFullYear();
  const [form, setForm] = useState({
    name: `${year} Annual Review`,
    type: "ANNUAL",
    periodStart: `${year}-01-01`,
    periodEnd: `${year}-12-31`,
    selfReviewStart: "",
    selfReviewEnd: "",
    managerReviewStart: "",
    managerReviewEnd: "",
    ratingScale: "5",
    autoCreateReviews: true,
  });

  function set<K extends keyof typeof form>(k: K, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setError({});
    setLoading(true);
    const res = await fetch("/api/performance/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        competencies: DEFAULT_COMPETENCIES,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const { cycle } = await res.json();
      setOpen(false);
      router.push(`/performance/cycles/${cycle.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || { _: "Failed to create cycle" });
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" /> New Cycle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-lg card max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Create Review Cycle</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Cycle name</label>
                <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
                {error.name && <p className="mt-1 text-xs text-red-600">{error.name}</p>}
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="ANNUAL">Annual</option>
                  <option value="SEMI_ANNUAL">Semi-Annual</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="PROBATION">Probation</option>
                  <option value="PROJECT_BASED">Project-Based</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Period start</label>
                  <input type="date" className="input" value={form.periodStart} onChange={(e) => set("periodStart", e.target.value)} />
                </div>
                <div>
                  <label className="label">Period end</label>
                  <input type="date" className="input" value={form.periodEnd} onChange={(e) => set("periodEnd", e.target.value)} />
                </div>
              </div>

              <div className="rounded-lg bg-ink-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">Review Windows (optional)</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Self-review start</label>
                    <input type="date" className="input" value={form.selfReviewStart} onChange={(e) => set("selfReviewStart", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Self-review end</label>
                    <input type="date" className="input" value={form.selfReviewEnd} onChange={(e) => set("selfReviewEnd", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Manager review start</label>
                    <input type="date" className="input" value={form.managerReviewStart} onChange={(e) => set("managerReviewStart", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Manager review end</label>
                    <input type="date" className="input" value={form.managerReviewEnd} onChange={(e) => set("managerReviewEnd", e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Rating scale</label>
                <select className="input" value={form.ratingScale} onChange={(e) => set("ratingScale", e.target.value)}>
                  <option value="5">1–5 scale</option>
                  <option value="10">1–10 scale</option>
                  <option value="percent">0–100 percent</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input id="autoCreate" type="checkbox" checked={form.autoCreateReviews} onChange={(e) => set("autoCreateReviews", e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                <label htmlFor="autoCreate" className="text-sm text-ink-700">
                  Auto-create review records for all active employees (reviewer = their reporting manager)
                </label>
              </div>

              <div className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                Default competencies (Job Knowledge, Quality, Productivity, Teamwork, Communication, Initiative) will be added. You can edit them after creation.
              </div>

              {error._ && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error._}</div>}

              <div className="flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={submit} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Cycle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
