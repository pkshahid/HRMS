"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, MoreVertical, Trash2, Pause, Play } from "lucide-react";
import { CurrencySelect } from "@/components/ui/currency-select";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
};

export function TenantsClient({ mode, tenant }: { mode: "create" | "row"; tenant?: Tenant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    slug: "",
    country: "",
    currency: "AED",
    timezone: "Asia/Dubai",
    plan: "standard",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function create() {
    setError({});
    setLoading(true);
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ name: "", slug: "", country: "", currency: "AED", timezone: "Asia/Dubai", plan: "standard", adminName: "", adminEmail: "", adminPassword: "" });
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || { _: "Failed to create tenant" });
    }
  }

  async function updateStatus(status: string) {
    setMenuOpen(false);
    if (!tenant) return;
    await fetch(`/api/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove() {
    setMenuOpen(false);
    if (!tenant) return;
    if (!confirm(`Delete tenant "${tenant.name}"? This will remove all its data.`)) return;
    await fetch(`/api/tenants/${tenant.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (mode === "row") {
    return (
      <div className="relative">
        <button onClick={() => setMenuOpen((v) => !v)} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100">
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-pop">
            {tenant?.status === "active" ? (
              <button onClick={() => updateStatus("suspended")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"><Pause className="h-4 w-4" /> Suspend</button>
            ) : (
              <button onClick={() => updateStatus("active")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"><Play className="h-4 w-4" /> Activate</button>
            )}
            <button onClick={remove} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Tenant</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-lg card max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Create New Tenant</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <SectionTitle>Organization</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" error={error.name}><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field>
                <Field label="Slug" error={error.slug} hint="lowercase, hyphens"><input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="my-company" required /></Field>
                <Field label="Country"><input className="input" value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
                <Field label="Currency"><CurrencySelect value={form.currency} onChange={(v) => set("currency", v)} /></Field>
                <Field label="Timezone"><input className="input" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} /></Field>
                <Field label="Plan">
                  <select className="input" value={form.plan} onChange={(e) => set("plan", e.target.value)}>
                    <option value="free">Free</option><option value="standard">Standard</option><option value="premium">Premium</option>
                  </select>
                </Field>
              </div>

              <SectionTitle>Initial Admin Account</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Admin name" error={error.adminName}><input className="input" value={form.adminName} onChange={(e) => set("adminName", e.target.value)} required /></Field>
                <Field label="Admin email" error={error.adminEmail}><input type="email" className="input" value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} required /></Field>
                <Field label="Admin password" error={error.adminPassword}><input type="password" className="input" value={form.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} required /></Field>
              </div>

              {error._ && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error._}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={create} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">{children}</div>;
}
function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label} {hint && <span className="text-xs font-normal text-ink-400">({hint})</span>}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
