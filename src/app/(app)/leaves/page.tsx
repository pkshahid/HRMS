import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatDate } from "@/lib/utils";
import { UserRole, LeaveStatus } from "@prisma/client";
import { PalmtreeIcon, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { LeavesListClient } from "@/components/leaves/leaves-list-client";

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const where: any = { tenantId: user.tenantId };
  if (searchParams.status) where.status = searchParams.status;

  const [leaves, pending, approved, rejected] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: { employee: true },
      orderBy: { appliedAt: "desc" },
    }),
    prisma.leaveRequest.count({ where: { tenantId: user.tenantId!, status: LeaveStatus.PENDING } }),
    prisma.leaveRequest.count({ where: { tenantId: user.tenantId!, status: LeaveStatus.APPROVED } }),
    prisma.leaveRequest.count({ where: { tenantId: user.tenantId!, status: LeaveStatus.REJECTED } }),
  ]);

  return (
    <>
      <PageHeader
        title="Vacation & Leave Requests"
        description="Review and approve employee leave requests."
        actions={<Link href="/leaves/apply" className="btn-primary"><PalmtreeIcon className="h-4 w-4" /> Apply Leave</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending} icon={Clock} accent="amber" />
        <StatCard label="Approved" value={approved} icon={CheckCircle} accent="green" />
        <StatCard label="Rejected" value={rejected} icon={XCircle} accent="red" />
      </div>

      <LeavesListClient leaves={leaves.map((l) => ({
        id: l.id,
        employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
        employeeCode: l.employee.employeeCode,
        type: l.type,
        status: l.status,
        startDate: formatDate(l.startDate),
        endDate: formatDate(l.endDate),
        totalDays: l.totalDays,
        reason: l.reason,
        appliedAt: formatDate(l.appliedAt),
        approverNote: l.approverNote,
      }))} canApprove={([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role)} />
    </>
  );
}
