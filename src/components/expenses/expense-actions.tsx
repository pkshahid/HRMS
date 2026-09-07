"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, DollarSign, Loader2 } from "lucide-react";
import { ExpenseStatus } from "@prisma/client";

export function ExpenseActions({
  claimId,
  status,
}: {
  claimId: string;
  status: ExpenseStatus;
}) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  async function action(action: string) {
    setActing(action);
    await fetch(`/api/expenses/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectReason: reason || undefined }),
    });
    setActing(null);
    setShowReject(false);
    setReason("");
    router.refresh();
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink-900">Actions</h3>
      <div className="mt-3 space-y-2">
        {status === ExpenseStatus.SUBMITTED && (
          <>
            <button
              onClick={() => action("approve")}
              disabled={acting !== null}
              className="btn-secondary w-full text-green-700 hover:bg-green-50"
            >
              {acting === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve
            </button>
            {showReject ? (
              <div className="space-y-2">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Rejection reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => action("reject")}
                    disabled={acting !== null || !reason}
                    className="btn-secondary flex-1 text-red-700 hover:bg-red-50"
                  >
                    {acting === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Confirm Reject
                  </button>
                  <button onClick={() => setShowReject(false)} className="btn-ghost">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReject(true)}
                disabled={acting !== null}
                className="btn-secondary w-full text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" /> Reject
              </button>
            )}
          </>
        )}
        {status === ExpenseStatus.APPROVED && (
          <button
            onClick={() => action("pay")}
            disabled={acting !== null}
            className="btn-primary w-full"
          >
            {acting === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            Mark as Paid
          </button>
        )}
        {(status === ExpenseStatus.SUBMITTED || status === ExpenseStatus.APPROVED) && (
          <button
            onClick={() => action("cancel")}
            disabled={acting !== null}
            className="btn-ghost w-full text-ink-500"
          >
            {acting === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Cancel Claim
          </button>
        )}
      </div>
    </div>
  );
}
