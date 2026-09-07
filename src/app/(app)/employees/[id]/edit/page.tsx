import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EmployeeEditForm } from "@/components/employees/employee-edit-form";
import { UserRole } from "@prisma/client";

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const [employee, departments, employees] = await Promise.all([
    prisma.employee.findUnique({ where: { id: params.id } }),
    prisma.department.findMany({ where: { tenantId: user.tenantId! }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { tenantId: user.tenantId! }, select: { id: true, firstName: true, lastName: true } }),
  ]);

  if (!employee || employee.tenantId !== user.tenantId) notFound();

  return (
    <EmployeeEditForm
      employee={JSON.parse(JSON.stringify(employee))}
      departments={departments}
      employees={employees}
    />
  );
}
