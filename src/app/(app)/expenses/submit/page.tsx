import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { UserRole } from "@prisma/client";
import { SubmitExpenseForm } from "@/components/expenses/submit-expense-form";
import { normalizeCurrency } from "@/lib/currency";

export default async function SubmitExpensePage() {
  const user = await requireAuth();

  const canChooseEmployee = ([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role);

  const employees = canChooseEmployee
    ? await prisma.employee.findMany({
        where: { tenantId: user.tenantId!, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
        orderBy: { firstName: "asc" },
      })
    : [];

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! } });

  return (
    <>
      <PageHeader
        title="Submit Expense Claim"
        description="Submit a new expense claim with itemized receipts."
      />
      <SubmitExpenseForm
        employees={employees}
        defaultEmployeeId={user.employeeId}
        canChoose={canChooseEmployee}
        currency={normalizeCurrency(tenant?.currency)}
      />
    </>
  );
}
