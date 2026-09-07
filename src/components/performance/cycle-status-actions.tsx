"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const NEXT: Record<string, string> = {
  DRAFT: "OPEN",
  OPEN: "REVIEW_IN_PROGRESS",
  REVIEW_IN_PROGRESS: "CLOSED",
  CLOSED: "OPEN",
};

const LABEL: Record<string, string> = {
  DRAFT: "Open Cycle",
  OPEN: "Start Reviews",
  REVIEW_IN_PROGRESS: "Close Cycle",
  CLOSED: "Reopen Cycle",
};

export function CycleStatusActions({ cycleId, currentStatus }: { cycleId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function advance() {
    setLoading(true);
    const next = NEXT[currentStatus] || "OPEN";
    await fetch(`/api/performance/cycles/${cycleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={advance} disabled={loading} className="btn-secondary">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {LABEL[currentStatus] || "Update Status"}
    </button>
  );
}
