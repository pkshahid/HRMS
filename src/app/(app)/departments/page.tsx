import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { initials } from "@/lib/utils";
import { Building2, Users } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function DepartmentsPage() {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER);

  const departments = await prisma.department.findMany({
    where: { tenantId: user.tenantId! },
    include: {
      _count: { select: { employees: true } },
      manager: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Departments"
        description={`${departments.length} department${departments.length === 1 ? "" : "s"} in your organization`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <div key={d.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Building2 className="h-5 w-5" />
              </div>
              {d.code && <span className="badge-gray">{d.code}</span>}
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink-900">{d.name}</h3>
            <div className="mt-3 flex items-center gap-4 text-sm text-ink-500">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {d._count.employees} members</span>
            </div>
            {d.manager && (
              <div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                  {initials(`${d.manager.firstName} ${d.manager.lastName}`)}
                </div>
                <div className="text-xs text-ink-600">
                  <span className="text-ink-400">Manager · </span>
                  {d.manager.firstName} {d.manager.lastName}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
