import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, PayrollStatus, AttendanceStatus } from "@prisma/client";
import { z } from "zod";
import { normalizeCurrency } from "@/lib/currency";

const generateSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  name: z.string().optional(),
  currency: z.string().optional(),
});

export async function GET() {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER);
  const payrolls = await prisma.payroll.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json({ payrolls });
}

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const body = await req.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const periodStart = new Date(d.periodStart);
  const periodEnd = new Date(d.periodEnd);

  // prevent duplicate payroll for same period
  const existing = await prisma.payroll.findUnique({
    where: { tenantId_periodStart_periodEnd: { tenantId: user.tenantId!, periodStart, periodEnd } },
  });
  if (existing) return NextResponse.json({ error: { _: "A payroll run already exists for this period" } }, { status: 400 });

  const name = d.name || `${periodStart.toLocaleString("en", { month: "long" })} ${periodStart.getFullYear()}`;

  // Resolve the payroll run currency: explicit → tenant default → AED
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! }, select: { currency: true } });
  const payrollCurrency = normalizeCurrency(d.currency, tenant?.currency || "AED");

  // get all active employees with salary structures
  const employees = await prisma.employee.findMany({
    where: { tenantId: user.tenantId!, status: "ACTIVE" },
    include: { salaryStructure: true },
  });

  const withSalary = employees.filter((e) => e.salaryStructure);

  // create payroll
  const payroll = await prisma.payroll.create({
    data: {
      tenantId: user.tenantId!,
      name,
      periodStart,
      periodEnd,
      status: PayrollStatus.DRAFT,
      currency: payrollCurrency,
      itemCount: withSalary.length,
    },
  });

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  for (const emp of withSalary) {
    const s = emp.salaryStructure!;
    const basic = Number(s.basicSalary);
    const housing = Number(s.housingAllowance);
    const transport = Number(s.transportAllowance);
    const food = Number(s.foodAllowance);
    const other = Number(s.otherAllowance);
    const allowances = housing + transport + food + other;
    const gross = basic + allowances;

    // attendance for the period
    const attendance = await prisma.attendance.findMany({
      where: { employeeId: emp.id, date: { gte: periodStart, lte: periodEnd } },
    });
    const presentDays = attendance.filter((a) =>
      ([AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.REMOTE, AttendanceStatus.HALF_DAY] as AttendanceStatus[]).includes(a.status)
    ).length;
    const leaveDays = attendance.filter((a) => a.status === AttendanceStatus.LEAVE).length;
    const overtimeHours = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const overtimeAmount = overtimeHours * Number(s.overtimeRate);

    // deductions
    const taxAmount = (gross * Number(s.taxRate)) / 100;
    const insuranceAmount = (gross * Number(s.insuranceRate)) / 100;
    const totalDed = taxAmount + insuranceAmount;
    const net = gross + overtimeAmount - totalDed;

    totalGross += gross + overtimeAmount;
    totalDeductions += totalDed;
    totalNet += net;

    await prisma.payrollItem.create({
      data: {
        payrollId: payroll.id,
        tenantId: user.tenantId!,
        employeeId: emp.id,
        currency: normalizeCurrency(s.currency, payrollCurrency),
        basicSalary: basic,
        totalAllowances: allowances,
        overtimeAmount,
        totalDeductions: totalDed,
        taxAmount,
        insuranceAmount,
        grossPay: gross + overtimeAmount,
        netPay: net,
        workingDays: 30,
        presentDays,
        leaveDays,
      },
    });
  }

  const updated = await prisma.payroll.update({
    where: { id: payroll.id },
    data: { totalGross, totalDeductions, totalNet },
  });

  return NextResponse.json({ payroll: updated }, { status: 201 });
}
