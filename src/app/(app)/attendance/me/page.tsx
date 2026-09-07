import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { CalendarCheck, Clock } from "lucide-react";

export default async function MyAttendancePage() {
  const user = await requireRole(UserRole.EMPLOYEE);
  if (!user.employeeId) {
    return <div className="card p-6 text-sm text-ink-500">No employee profile linked to your account.</div>;
  }

  const records = await prisma.attendance.findMany({
    where: { employeeId: user.employeeId },
    orderBy: { date: "desc" },
    take: 60,
  });

  const present = records.filter((r) => (["PRESENT", "LATE", "REMOTE", "HALF_DAY"] as string[]).includes(r.status)).length;
  const late = records.filter((r) => r.status === "LATE").length;
  const totalHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);

  return (
    <>
      <PageHeader title="My Attendance" description="Your recent attendance records." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Present Days" value={present} icon={CalendarCheck} accent="green" />
        <StatCard label="Late Days" value={late} icon={Clock} accent="amber" />
        <StatCard label="Total Hours" value={`${Math.round(totalHours)}h`} icon={Clock} accent="brand" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-ink-500">No attendance records yet.</td></tr>
              )}
              {records.map((r) => (
                <tr key={r.id}>
                  <td data-label="Date">{formatDate(r.date)}</td>
                  <td data-label="Day">{new Date(r.date).toLocaleDateString("en-GB", { weekday: "short" })}</td>
                  <td data-label="Check In">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td data-label="Check Out">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td data-label="Hours">{r.workHours ? `${r.workHours}h` : "—"}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
