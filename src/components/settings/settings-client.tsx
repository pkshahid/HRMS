"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { CurrencySelect } from "@/components/ui/currency-select";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  currency: string;
  timezone: string;
  plan: string;
  status: string;
};

export function SettingsClient({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: tenant.name,
    country: tenant.country || "",
    currency: tenant.currency,
    timezone: tenant.timezone,
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setLoading(true);
    setSaved(false);
    await fetch(`/api/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card p-6">
        <h2 className="section-title">Organization</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input bg-ink-50" value={tenant.slug} disabled />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={form.country} onChange={(e) => set("country", e.target.value)} />
          </div>
          <div>
            <label className="label">Currency</label>
            <CurrencySelect value={form.currency} onChange={(v) => set("currency", v)} />
          </div>
          <div>
            <label className="label">Timezone</label>
            <input className="input" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
          </div>
          <div>
            <label className="label">Plan</label>
            <input className="input bg-ink-50 capitalize" value={tenant.plan} disabled />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </button>
          {saved && <span className="text-sm text-green-600">Saved successfully</span>}
        </div>
      </div>
    </div>
  );
}
