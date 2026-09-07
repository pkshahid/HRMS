import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";
import { UserRole } from "@prisma/client";
import { EmployeesListClient } from "@/components/employees/employees-list-client";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { q?: string; departmentId?: string };
}) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where: {
        tenantId: user.tenantId!,
        ...(searchParams.q
          ? {
              OR: [
                { firstName: { contains: searchParams.q, mode: "insensitive" } },
                { lastName: { contains: searchParams.q, mode: "insensitive" } },
                { email: { contains: searchParams.q, mode: "insensitive" } },
                { employeeCode: { contains: searchParams.q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(searchParams.departmentId && searchParams.departmentId !== "all"
          ? { departmentId: searchParams.departmentId }
          : {}),
      },
      include: { department: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ where: { tenantId: user.tenantId! }, orderBy: { name: "asc" } }),
  ]);

  const canCreate = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${employees.length} employee${employees.length === 1 ? "" : "s"} in your organization`}
        actions={
          canCreate && (
            <Link href="/employees/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Add Employee
            </Link>
          )
        }
      />

      <EmployeesListClient
        employees={employees.map((e) => ({
          id: e.id,
          employeeCode: e.employeeCode,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phone: e.phone,
          designation: e.designation,
          departmentName: e.department?.name || "—",
          status: e.status,
          joinDate: formatDate(e.joinDate),
          nationality: e.nationality,
        }))}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        initialQuery={searchParams.q || ""}
        initialDept={searchParams.departmentId || "all"}
      />
    </>
  );
}
