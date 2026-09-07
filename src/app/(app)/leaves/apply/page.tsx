import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { UserRole } from "@prisma/client";
import { ApplyLeaveForm } from "@/components/leaves/apply-leave-form";

export default async function ApplyLeavePage() {
  const user = await requireAuth();
  const canApplyOnBehalf = ([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role);

  const employees = canApplyOnBehalf
    ? await prisma.employee.findMany({
        where: { tenantId: user.tenantId!, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
        orderBy: { firstName: "asc" },
      })
    : [];

  const balances = user.employeeId
    ? await prisma.leaveBalance.findMany({
        where: { employeeId: user.employeeId, year: new Date().getFullYear() },
      })
    : [];

  return (
    <>
      <PageHeader title="Apply for Leave" description="Submit a new leave / vacation request." />
      <div className="mx-auto max-w-2xl">
        {balances.length > 0 && (
          <div className="card mb-5 p-4">
            <h3 className="text-sm font-semibold text-ink-900">Your Leave Balances ({new Date().getFullYear()})</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {balances.map((b) => (
                <div key={b.id} className="rounded-lg border border-ink-100 p-3">
                  <div className="text-xs capitalize text-ink-400">{b.type.toLowerCase()}</div>
                  <div className="mt-1 text-sm font-semibold text-ink-900">
                    {b.entitled - b.used} / {b.entitled} days
                  </div>
                  <div className="text-xs text-ink-500">{b.used} used</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <ApplyLeaveForm employees={employees} defaultEmployeeId={user.employeeId} canChoose={canApplyOnBehalf} />
      </div>
    </>
  );
}
