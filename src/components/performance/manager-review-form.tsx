"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Save } from "lucide-react";

export function ManagerReviewForm({ reviewId, maxRating, competencies }: { reviewId: string; maxRating: number; competencies: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    managerRating: 3,
    managerAchievements: "",
    managerStrengths: "",
    managerImprovements: "",
    managerComments: "",
    finalRating: 3,
    finalComments: "",
    recommendations: "",
  });
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(competencies.map((c) => [c.name, 3]))
  );

  async function submit(complete: boolean) {
    setLoading(true);
    setError("");
    const competencyScores = competencies.map((c) => ({ name: c.name, score: scores[c.name] || 3, comment: "" }));
    const res = await fetch("/api/performance/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId,
        managerRating: form.managerRating,
        managerAchievements: form.managerAchievements,
        managerStrengths: form.managerStrengths,
        managerImprovements: form.managerImprovements,
        managerComments: form.managerComments,
        competencyScores,
        finalRating: form.finalRating,
        finalComments: form.finalComments,
        recommendations: form.recommendations,
        complete,
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error?._ || "Failed to submit");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Overall manager rating (1–{maxRating})</label>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={maxRating} value={form.managerRating} onChange={(e) => setForm({ ...form, managerRating: Number(e.target.value) })} className="flex-1" />
          <span className="w-12 text-center text-sm font-semibold text-ink-900">{form.managerRating} / {maxRating}</span>
        </div>
      </div>

      {competencies.length > 0 && (
        <div className="rounded-lg bg-ink-50 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Competency Scores</div>
          <div className="space-y-2">
            {competencies.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-ink-800">{c.name}</div>
                  <div className="text-xs text-ink-500">{c.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={1} max={maxRating} value={scores[c.name] || 3} onChange={(e) => setScores({ ...scores, [c.name]: Number(e.target.value) })} className="w-24" />
                  <span className="w-8 text-center text-xs font-semibold text-ink-900">{scores[c.name] || 3}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TextArea label="Key achievements observed" value={form.managerAchievements} onChange={(v) => setForm({ ...form, managerAchievements: v })} />
      <TextArea label="Strengths" value={form.managerStrengths} onChange={(v) => setForm({ ...form, managerStrengths: v })} />
      <TextArea label="Areas for improvement" value={form.managerImprovements} onChange={(v) => setForm({ ...form, managerImprovements: v })} />
      <TextArea label="Comments" value={form.managerComments} onChange={(v) => setForm({ ...form, managerComments: v })} />

      <div className="border-t border-ink-100 pt-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Final Outcome</div>
        <div>
          <label className="label">Final calibrated rating (1–{maxRating})</label>
          <div className="flex items-center gap-2">
            <input type="range" min={1} max={maxRating} value={form.finalRating} onChange={(e) => setForm({ ...form, finalRating: Number(e.target.value) })} className="flex-1" />
            <span className="w-12 text-center text-sm font-semibold text-ink-900">{form.finalRating} / {maxRating}</span>
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Recommendations</label>
          <select className="input" value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })}>
            <option value="">— Select —</option>
            <option value="Promotion consideration">Promotion consideration</option>
            <option value="Salary increase">Salary increase</option>
            <option value="Bonus">Bonus</option>
            <option value="Performance Improvement Plan">Performance Improvement Plan</option>
            <option value="Role change">Role change</option>
            <option value="No change">No change</option>
          </select>
        </div>
        <div className="mt-3">
          <TextArea label="Final comments" value={form.finalComments} onChange={(v) => setForm({ ...form, finalComments: v })} />
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end gap-2">
        <button onClick={() => submit(false)} disabled={loading} className="btn-secondary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
        </button>
        <button onClick={() => submit(true)} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete Review
        </button>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input min-h-[80px]" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
