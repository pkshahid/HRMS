import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmployeeForm } from "@/components/employees/employee-form";
import { UserRole } from "@prisma/client";

export default async function NewEmployeePage() {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const [departments, employees, tenant] = await Promise.all([
    prisma.department.findMany({ where: { tenantId: user.tenantId! }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { tenantId: user.tenantId! }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
    prisma.tenant.findUnique({ where: { id: user.tenantId! } }),
  ]);

  return (
    <EmployeeForm
      departments={departments}
      employees={employees}
      tenantCountry={tenant?.country}
    />
  );
}
