"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

export function SelfReviewForm({ reviewId, maxRating }: { reviewId: string; maxRating: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    selfRating: 3,
    selfAchievements: "",
    selfStrengths: "",
    selfImprovements: "",
    selfComments: "",
  });

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/performance/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, ...form }),
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
        <label className="label">Overall self-rating (1–{maxRating})</label>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={maxRating} value={form.selfRating} onChange={(e) => setForm({ ...form, selfRating: Number(e.target.value) })} className="flex-1" />
          <span className="w-12 text-center text-sm font-semibold text-ink-900">{form.selfRating} / {maxRating}</span>
        </div>
      </div>

      <TextArea label="Key achievements this period" value={form.selfAchievements} onChange={(v) => setForm({ ...form, selfAchievements: v })} placeholder="What did you accomplish?" />
      <TextArea label="Your strengths" value={form.selfStrengths} onChange={(v) => setForm({ ...form, selfStrengths: v })} placeholder="What do you do well?" />
      <TextArea label="Areas for improvement" value={form.selfImprovements} onChange={(v) => setForm({ ...form, selfImprovements: v })} placeholder="Where can you grow?" />
      <TextArea label="Additional comments" value={form.selfComments} onChange={(v) => setForm({ ...form, selfComments: v })} placeholder="Anything else you'd like to share?" />

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <button onClick={submit} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit Self-Assessment
      </button>
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
