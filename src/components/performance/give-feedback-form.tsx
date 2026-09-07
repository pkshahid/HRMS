"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

type Emp = { id: string; name: string; designation?: string | null };
type Cycle = { id: string; name: string };

export function GiveFeedbackForm({ employees, cycles }: { employees: Emp[]; cycles: Cycle[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    toEmployeeId: "",
    cycleId: "",
    type: "PEER",
    rating: 4,
    strengths: "",
    improvements: "",
    comments: "",
    isAnonymous: false,
  });

  async function submit() {
    if (!form.toEmployeeId) {
      setError("Please select a colleague");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/performance/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cycleId: form.cycleId || null }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/performance/my-feedback"), 1500);
    } else {
      const d = await res.json();
      setError(d.error?._ || "Failed to submit feedback");
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100"><Check className="h-6 w-6 text-emerald-600" /></div>
        <div className="mt-3 text-sm font-medium text-ink-900">Feedback submitted!</div>
        <div className="text-xs text-ink-500">Redirecting…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Colleague</label>
        <select className="input" value={form.toEmployeeId} onChange={(e) => setForm({ ...form, toEmployeeId: e.target.value })}>
          <option value="">— Select —</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.designation ? ` · ${e.designation}` : ""}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Cycle (optional)</label>
          <select className="input" value={form.cycleId} onChange={(e) => setForm({ ...form, cycleId: e.target.value })}>
            <option value="">— None —</option>
            {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Feedback type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="PEER">Peer</option>
            <option value="MANAGER">Manager</option>
            <option value="HR">HR</option>
            <option value="SKIP_LEVEL">Skip-Level</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Overall rating (1–5)</label>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="flex-1" />
          <span className="w-12 text-center text-sm font-semibold text-ink-900">{form.rating} / 5</span>
        </div>
      </div>
      <div>
        <label className="label">Strengths</label>
        <textarea className="input min-h-[70px]" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} placeholder="What do they do well?" />
      </div>
      <div>
        <label className="label">Areas for improvement</label>
        <textarea className="input min-h-[70px]" value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} placeholder="Where can they grow?" />
      </div>
      <div>
        <label className="label">Additional comments</label>
        <textarea className="input min-h-[60px]" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <input id="anon" type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
        <label htmlFor="anon" className="text-sm text-ink-700">Submit anonymously (your name will be hidden from non-admins)</label>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <button onClick={submit} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit Feedback
      </button>
    </div>
  );
}
