"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, DollarSign, XCircle, Play } from "lucide-react";

export function PayrollActions({ payrollId, status }: { payrollId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function update(next: string) {
    setLoading(next);
    await fetch(`/api/payroll/${payrollId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(null);
    router.refresh();
  }

  if (status === "PAID") return null;
  if (status === "CANCELLED") return null;

  return (
    <div className="flex items-center gap-2">
      {status === "DRAFT" && (
        <button onClick={() => update("PROCESSING")} disabled={loading === "PROCESSING"} className="btn-secondary">
          {loading === "PROCESSING" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Process
        </button>
      )}
      {(status === "DRAFT" || status === "PROCESSING") && (
        <button onClick={() => update("APPROVED")} disabled={loading === "APPROVED"} className="btn-secondary text-green-700 hover:bg-green-50">
          {loading === "APPROVED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve
        </button>
      )}
      {status === "APPROVED" && (
        <button onClick={() => update("PAID")} disabled={loading === "PAID"} className="btn-primary">
          {loading === "PAID" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />} Mark as Paid
        </button>
      )}
      <button onClick={() => update("CANCELLED")} disabled={!!loading} className="btn-ghost text-red-600 hover:bg-red-50">
        {loading === "CANCELLED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Cancel
      </button>
    </div>
  );
}
