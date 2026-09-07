"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, DollarSign, Loader2, Plus } from "lucide-react";
import { AdvanceStatus } from "@prisma/client";

export function AdvanceActions({
  advanceId,
  status,
  remainingAmount,
  currency,
}: {
  advanceId: string;
  status: AdvanceStatus;
  remainingAmount: number;
  currency: string;
}) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [reason, setReason] = useState("");
  const [recoveryAmount, setRecoveryAmount] = useState("");

  async function action(action: string, extra?: Record<string, unknown>) {
    setActing(action);
    await fetch(`/api/advances/${advanceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setActing(null);
    setShowReject(false);
    setShowRecovery(false);
    setReason("");
    setRecoveryAmount("");
    router.refresh();
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink-900">Actions</h3>
      <div className="mt-3 space-y-2">
        {status === AdvanceStatus.PENDING && (
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
                    onClick={() => action("reject", { rejectReason: reason })}
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

        {status === AdvanceStatus.APPROVED && (
          <button
            onClick={() => action("disburse")}
            disabled={acting !== null}
            className="btn-primary w-full"
          >
            {acting === "disburse" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            Mark as Disbursed
          </button>
        )}

        {(status === AdvanceStatus.RECOVERING || status === AdvanceStatus.DISBURSED) && remainingAmount > 0 && (
          <>
            {showRecovery ? (
              <div className="space-y-2">
                <label className="label">Recovery Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  className="input"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  placeholder={`Max: ${remainingAmount}`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => action("record_recovery", { recoveredAmount: parseFloat(recoveryAmount) })}
                    disabled={acting !== null || !recoveryAmount || parseFloat(recoveryAmount) <= 0}
                    className="btn-primary flex-1"
                  >
                    {acting === "record_recovery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Record Recovery
                  </button>
                  <button onClick={() => setShowRecovery(false)} className="btn-ghost">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRecovery(true)}
                disabled={acting !== null}
                className="btn-secondary w-full"
              >
                <Plus className="h-4 w-4" /> Record Recovery Payment
              </button>
            )}
          </>
        )}

        {(status === AdvanceStatus.PENDING || status === AdvanceStatus.APPROVED) && (
          <button
            onClick={() => action("cancel")}
            disabled={acting !== null}
            className="btn-ghost w-full text-ink-500"
          >
            {acting === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
}
