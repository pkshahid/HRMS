import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const map: Record<string, string> = {
    ACTIVE: "badge-green",
    PRESENT: "badge-green",
    APPROVED: "badge-green",
    PAID: "badge-green",
    ON_LEAVE: "badge-amber",
    PENDING: "badge-amber",
    LATE: "badge-amber",
    DRAFT: "badge-gray",
    PROCESSING: "badge-blue",
    HALF_DAY: "badge-blue",
    REMOTE: "badge-blue",
    ABSENT: "badge-red",
    REJECTED: "badge-red",
    TERMINATED: "badge-red",
    SUSPENDED: "badge-red",
    CANCELLED: "badge-gray",
    HOLIDAY: "badge-gray",
    LEAVE: "badge-amber",
  };
  const cls = map[s] || "badge-gray";
  return <span className={cn(cls, "capitalize")}>{status.toLowerCase().replace("_", " ")}</span>;
}
