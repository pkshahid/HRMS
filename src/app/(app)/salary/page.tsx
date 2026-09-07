import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { UserRole } from "@prisma/client";
import { SalaryListClient } from "@/components/salary/salary-list-client";

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: { employee?: string };
}) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const [employees, structures, tenant] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId: user.tenantId!, status: "ACTIVE" },
      orderBy: { firstName: "asc" },
      include: { department: { select: { name: true } } },
    }),
    prisma.salaryStructure.findMany({
      where: { tenantId: user.tenantId! },
      include: { employee: true },
    }),
    prisma.tenant.findUnique({ where: { id: user.tenantId! } }),
  ]);

  const currency = tenant?.currency || "AED";
  const structureMap = new Map(structures.map((s) => [s.employeeId, s]));

  return (
    <>
      <PageHeader
        title="Salary Structures"
        description="Configure base salary, allowances and deductions for each employee."
      />

      <SalaryListClient
        employees={employees.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode,
          designation: e.designation,
          department: e.department?.name || "—",
          hasStructure: structureMap.has(e.id),
          gross: structureMap.get(e.id)
            ? Number(structureMap.get(e.id)!.basicSalary) +
              Number(structureMap.get(e.id)!.housingAllowance) +
              Number(structureMap.get(e.id)!.transportAllowance) +
              Number(structureMap.get(e.id)!.foodAllowance) +
              Number(structureMap.get(e.id)!.otherAllowance)
            : null,
        }))}
        currency={currency}
        preselectEmployeeId={searchParams.employee}
      />
    </>
  );
}
