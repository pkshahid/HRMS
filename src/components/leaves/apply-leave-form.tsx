"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send, ArrowLeft } from "lucide-react";

type Emp = { id: string; firstName: string; lastName: string; employeeCode: string };

export function ApplyLeaveForm({
  employees,
  defaultEmployeeId,
  canChoose,
}: {
  employees: Emp[];
  defaultEmployeeId: string | null;
  canChoose: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId || "",
    type: "ANNUAL",
    startDate: today,
    endDate: today,
    reason: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date must be after start date.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push(canChoose ? "/leaves" : "/leaves/me");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error?._ || data.error || "Failed to submit request");
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <div className="space-y-4">
        {canChoose && (
          <div>
            <label className="label">Employee</label>
            <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Leave type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="ANNUAL">Annual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="MATERNITY">Maternity Leave</option>
            <option value="PATERNITY">Paternity Leave</option>
            <option value="EMERGENCY">Emergency Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Start date</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" className="input" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="label">Reason</label>
          <textarea className="input min-h-[90px]" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe the reason for your leave..." />
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Link href={canChoose ? "/leaves" : "/leaves/me"} className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit Request
          </button>
        </div>
      </div>
    </form>
  );
}
