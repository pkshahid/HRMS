import { PrismaClient, ExpenseCategory, ExpenseStatus, AdvanceType, AdvanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: "gulf-tech" } });
  if (!tenant) throw new Error("gulftech tenant not found");

  const employees = await prisma.employee.findMany({ where: { tenantId: tenant.id }, include: { user: true } });
  if (employees.length < 2) throw new Error("need at least 2 employees");

  const [emp1, emp2, emp3] = employees;
  const manager = employees.find((e) => e.user?.role === "MANAGER") || employees[0];
  const admin = employees.find((e) => e.user?.role === "ADMIN") || employees[1];

  const currency = tenant.currency || "AED";

  // --- Expense claims ---
  const claim1 = await prisma.expenseClaim.create({
    data: {
      tenantId: tenant.id,
      employeeId: emp1.id,
      approverId: manager.id,
      status: ExpenseStatus.APPROVED,
      title: "Client visit — Dubai",
      description: "Travel and meals for client meeting at DIFC",
      totalAmount: 1450,
      currency,
      periodStart: new Date("2026-08-10"),
      periodEnd: new Date("2026-08-12"),
      submittedAt: new Date("2026-08-13"),
      approvedAt: new Date("2026-08-15"),
      items: {
        create: [
          { category: ExpenseCategory.TRAVEL, description: "Flight ticket", amount: 800, date: new Date("2026-08-10") },
          { category: ExpenseCategory.ACCOMMODATION, description: "Hotel 2 nights", amount: 450, date: new Date("2026-08-10") },
          { category: ExpenseCategory.MEALS, description: "Client dinner", amount: 200, date: new Date("2026-08-11") },
        ],
      },
    },
  });

  const claim2 = await prisma.expenseClaim.create({
    data: {
      tenantId: tenant.id,
      employeeId: emp2.id,
      status: ExpenseStatus.SUBMITTED,
      title: "Office supplies — August",
      description: "Stationery and printer consumables",
      totalAmount: 320,
      currency,
      submittedAt: new Date("2026-08-20"),
      items: {
        create: [
          { category: ExpenseCategory.OFFICE_SUPPLIES, description: "A4 paper (10 reams)", amount: 120, date: new Date("2026-08-18") },
          { category: ExpenseCategory.OFFICE_SUPPLIES, description: "Printer toner x2", amount: 200, date: new Date("2026-08-19") },
        ],
      },
    },
  });

  const claim3 = await prisma.expenseClaim.create({
    data: {
      tenantId: tenant.id,
      employeeId: emp3?.id || emp1.id,
      status: ExpenseStatus.PAID,
      title: "Training course — AWS certification",
      description: "AWS Solutions Architect training and exam fee",
      totalAmount: 2500,
      currency,
      approverId: admin.id,
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-31"),
      submittedAt: new Date("2026-07-15"),
      approvedAt: new Date("2026-07-18"),
      paidAt: new Date("2026-07-25"),
      items: {
        create: [
          { category: ExpenseCategory.TRAINING, description: "AWS training course", amount: 2000, date: new Date("2026-07-05") },
          { category: ExpenseCategory.TRAINING, description: "Exam fee", amount: 500, date: new Date("2026-07-20") },
        ],
      },
    },
  });

  // --- Advance payments ---
  await prisma.advancePayment.create({
    data: {
      tenantId: tenant.id,
      employeeId: emp1.id,
      approverId: manager.id,
      type: AdvanceType.SALARY_ADVANCE,
      status: AdvanceStatus.RECOVERING,
      amount: 3000,
      currency,
      reason: "Medical emergency",
      requestDate: new Date("2026-08-01"),
      disburseDate: new Date("2026-08-03"),
      installments: 3,
      installmentAmount: 1000,
      recoveredAmount: 1000,
      remainingAmount: 2000,
      monthlyDeduction: 1000,
      approvedAt: new Date("2026-08-02"),
      recoveryHistory: JSON.stringify([{ payrollId: null, date: "2026-08-31", amount: 1000 }]),
    },
  });

  await prisma.advancePayment.create({
    data: {
      tenantId: tenant.id,
      employeeId: emp2.id,
      approverId: admin.id,
      type: AdvanceType.LOAN,
      status: AdvanceStatus.APPROVED,
      amount: 10000,
      currency,
      reason: "Furniture purchase for new apartment",
      requestDate: new Date("2026-08-15"),
      installments: 10,
      installmentAmount: 1000,
      recoveredAmount: 0,
      remainingAmount: 10000,
      monthlyDeduction: 1000,
      approvedAt: new Date("2026-08-17"),
    },
  });

  await prisma.advancePayment.create({
    data: {
      tenantId: tenant.id,
      employeeId: emp3?.id || emp1.id,
      type: AdvanceType.PETTY_CASH,
      status: AdvanceStatus.PENDING,
      amount: 500,
      currency,
      reason: "Office petty cash for courier and small purchases",
      requestDate: new Date("2026-08-25"),
      installments: 1,
      installmentAmount: 500,
      recoveredAmount: 0,
      remainingAmount: 500,
      monthlyDeduction: 500,
    },
  });

  console.log("Seed complete:");
  console.log(`  Expenses: 3 claims (${claim1.id}, ${claim2.id}, ${claim3.id})`);
  console.log(`  Advances: 3 records`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
