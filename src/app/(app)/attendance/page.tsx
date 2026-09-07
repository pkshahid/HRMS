import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { CalendarCheck, Users, Clock, AlertCircle } from "lucide-react";
import { AttendanceClient } from "@/components/attendance/attendance-client";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const dateStr = searchParams.date || new Date().toISOString().split("T")[0];
  const date = new Date(dateStr);
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);

  const [employees, records] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId: user.tenantId!, status: "ACTIVE" },
      orderBy: { firstName: "asc" },
    }),
    prisma.attendance.findMany({
      where: { tenantId: user.tenantId!, date: { gte: start, lt: end } },
    }),
  ]);

  const present = records.filter((r) => (["PRESENT", "LATE", "REMOTE", "HALF_DAY"] as string[]).includes(r.status)).length;
  const absent = employees.length - present;
  const late = records.filter((r) => r.status === "LATE").length;

  return (
    <>
      <PageHeader title="Attendance" description={`Daily attendance for ${formatDate(date)}`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={employees.length} icon={Users} accent="brand" />
        <StatCard label="Present" value={present} icon={CalendarCheck} accent="green" />
        <StatCard label="Late" value={late} icon={Clock} accent="amber" />
        <StatCard label="Absent" value={absent} icon={AlertCircle} accent="red" />
      </div>

      <AttendanceClient
        employees={employees.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode,
          designation: e.designation,
        }))}
        records={records.map((r) => ({
          id: r.id,
          employeeId: r.employeeId,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          status: r.status,
          workHours: r.workHours,
          lateMinutes: r.lateMinutes,
          notes: r.notes,
        }))}
        date={dateStr}
      />
    </>
  );
}
