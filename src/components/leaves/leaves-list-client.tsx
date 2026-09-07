"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initials } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, Loader2, MessageSquare } from "lucide-react";

type Row = {
  id: string;
  employeeName: string;
  employeeCode: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string | null;
  appliedAt: string;
  approverNote?: string | null;
};

export function LeavesListClient({ leaves, canApprove }: { leaves: Row[]; canApprove: boolean }) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    setActing(id);
    await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, approverNote: note || undefined }),
    });
    setActing(null);
    setNoteOpen(null);
    setNote("");
    router.refresh();
  }

  if (leaves.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-ink-900">No leave requests</h3>
        <p className="mt-1 text-sm text-ink-500">Leave requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaves.map((l) => (
        <div key={l.id} className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {initials(l.employeeName)}
              </div>
              <div>
                <div className="font-medium text-ink-900">{l.employeeName}</div>
                <div className="text-xs text-ink-500">{l.employeeCode} · {l.type.toLowerCase()} · {l.totalDays} day{l.totalDays === 1 ? "" : "s"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-ink-700">{l.startDate} → {l.endDate}</div>
                <div className="text-xs text-ink-400">Applied {l.appliedAt}</div>
              </div>
              <StatusBadge status={l.status} />
            </div>
          </div>

          {l.reason && (
            <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">
              <span className="font-medium text-ink-700">Reason: </span>{l.reason}
            </div>
          )}
          {l.approverNote && (
            <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
              <span className="font-medium">Approver note: </span>{l.approverNote}
            </div>
          )}

          {canApprove && l.status === "PENDING" && (
            <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-3 sm:flex-row sm:items-center">
              <input
                className="input flex-1"
                placeholder="Add a note (optional)..."
                value={noteOpen === l.id ? note : ""}
                onFocus={() => setNoteOpen(l.id)}
                onChange={(e) => { setNoteOpen(l.id); setNote(e.target.value); }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => decide(l.id, "APPROVED")}
                  disabled={acting === l.id}
                  className="btn-secondary flex-1 text-green-700 hover:bg-green-50 sm:flex-none"
                >
                  {acting === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                </button>
                <button
                  onClick={() => decide(l.id, "REJECTED")}
                  disabled={acting === l.id}
                  className="btn-secondary flex-1 text-red-700 hover:bg-red-50 sm:flex-none"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
