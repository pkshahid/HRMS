import { cn } from "@/lib/utils";

export function PerfStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const map: Record<string, string> = {
    // CycleStatus
    DRAFT: "badge-gray",
    OPEN: "badge-blue",
    REVIEW_IN_PROGRESS: "badge-amber",
    CLOSED: "badge-green",
    // ReviewStatus
    NOT_STARTED: "badge-gray",
    SELF_REVIEW_PENDING: "badge-amber",
    SELF_REVIEW_DONE: "badge-blue",
    MANAGER_REVIEW_PENDING: "badge-amber",
    MANAGER_REVIEW_DONE: "badge-blue",
    CALIBRATION: "badge-amber",
    COMPLETED: "badge-green",
    CANCELLED: "badge-red",
    // GoalStatus
    IN_PROGRESS: "badge-blue",
    ON_TRACK: "badge-green",
    AT_RISK: "badge-amber",
    ACHIEVED: "badge-green",
    MISSED: "badge-red",
  };
  const cls = map[s] || "badge-gray";
  return <span className={cn(cls, "capitalize")}>{status.toLowerCase().replace(/_/g, " ")}</span>;
}

export function RatingStars({ rating, max = 5 }: { rating: number | null; max?: number }) {
  if (rating === null || rating === undefined) return <span className="text-ink-400">—</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="font-semibold text-ink-900">{rating}</span>
      <span className="text-ink-400">/ {max}</span>
    </div>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const c = color || (value >= 100 ? "bg-emerald-500" : value >= 75 ? "bg-brand-500" : value >= 50 ? "bg-amber-500" : "bg-red-500");
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div className={cn("h-full rounded-full transition-all", c)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium text-ink-600">{value}%</span>
    </div>
  );
}
