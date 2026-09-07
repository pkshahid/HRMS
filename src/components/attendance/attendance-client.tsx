"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initials } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, Check, X, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

type Emp = { id: string; name: string; code: string; designation?: string | null };
type Rec = {
  id: string;
  employeeId: string;
  checkIn: Date | string | null;
  checkOut: Date | string | null;
  status: string;
  workHours: number | null;
  lateMinutes: number | null;
  notes?: string | null;
};

function fmtTime(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function AttendanceClient({
  employees,
  records,
  date,
}: {
  employees: Emp[];
  records: Rec[];
  date: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const recordMap = new Map(records.map((r) => [r.employeeId, r]));

  function shiftDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().split("T")[0];
    const sp = new URLSearchParams(params.toString());
    sp.set("date", next);
    startTransition(() => router.replace(`/attendance?${sp.toString()}`));
  }

  async function mark(empId: string, status: "PRESENT" | "ABSENT" | "REMOTE" | "LEAVE") {
    setSaving(empId);
    const checkIn = status === "PRESENT" || status === "REMOTE" ? new Date(`${date}T09:00:00`).toISOString() : null;
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: empId, date, status, checkIn, source: "manual" }),
    });
    setSaving(null);
    router.refresh();
  }

  async function saveCheck(empId: string, checkIn: string, checkOut: string) {
    setSaving(empId);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: empId, date, checkIn: checkIn || null, checkOut: checkOut || null, source: "manual" }),
    });
    setSaving(null);
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <div className="card mb-5 flex items-center justify-between p-3">
        <button onClick={() => shiftDate(-1)} className="btn-ghost"><ChevronLeft className="h-4 w-4" /></button>
        <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
          <Calendar className="h-4 w-4 text-brand-600" />
          {new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>
        <button onClick={() => shiftDate(1)} className="btn-ghost"><ChevronRight className="h-4 w-4" /></button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const r = recordMap.get(e.id);
                const isEditing = editing === e.id;
                return (
                  <tr key={e.id}>
                    <td data-label="Employee">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                          {initials(e.name)}
                        </div>
                        <div>
                          <div className="font-medium text-ink-900">{e.name}</div>
                          <div className="text-xs text-ink-500">{e.code} · {e.designation || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Check In">
                      {isEditing ? (
                        <input type="time" defaultValue={r?.checkIn ? fmtTime(r.checkIn) : "09:00"} className="input py-1" id={`ci-${e.id}`} />
                      ) : (
                        fmtTime(r?.checkIn || null)
                      )}
                    </td>
                    <td data-label="Check Out">
                      {isEditing ? (
                        <input type="time" defaultValue={r?.checkOut ? fmtTime(r.checkOut) : "18:00"} className="input py-1" id={`co-${e.id}`} />
                      ) : (
                        fmtTime(r?.checkOut || null)
                      )}
                    </td>
                    <td data-label="Hours">{r?.workHours ? `${r.workHours}h` : "—"}</td>
                    <td data-label="Status">{r ? <StatusBadge status={r.status} /> : <span className="badge-gray">Not marked</span>}</td>
                    <td data-label="Actions">
                      <div className="flex items-center gap-1">
                        {saving === e.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                        ) : isEditing ? (
                          <button
                            onClick={() => {
                              const ci = (document.getElementById(`ci-${e.id}`) as HTMLInputElement)?.value;
                              const co = (document.getElementById(`co-${e.id}`) as HTMLInputElement)?.value;
                              const ciFull = ci ? `${date}T${ci}:00` : null;
                              const coFull = co ? `${date}T${co}:00` : null;
                              saveCheck(e.id, ciFull || "", coFull || "");
                            }}
                            className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => mark(e.id, "PRESENT")} className="rounded-md p-1.5 text-green-600 hover:bg-green-50" title="Present"><Check className="h-4 w-4" /></button>
                            <button onClick={() => mark(e.id, "ABSENT")} className="rounded-md p-1.5 text-red-600 hover:bg-red-50" title="Absent"><X className="h-4 w-4" /></button>
                            <button onClick={() => mark(e.id, "REMOTE")} className="rounded-md p-1.5 text-brand-600 hover:bg-brand-50" title="Remote"><Clock className="h-4 w-4" /></button>
                            <button onClick={() => setEditing(e.id)} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100" title="Edit times"><Calendar className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
