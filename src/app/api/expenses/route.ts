import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UserRole, ExpenseStatus, ExpenseCategory } from "@prisma/client";
import { z } from "zod";
import { normalizeCurrency } from "@/lib/currency";

const itemSchema = z.object({
  category: z.enum([
    "TRAVEL", "MEALS", "ACCOMMODATION", "TRANSPORT", "EQUIPMENT",
    "TRAINING", "MEDICAL", "OFFICE_SUPPLIES", "COMMUNICATION", "MISC",
  ]).optional(),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  date: z.string(),
  receiptUrl: z.string().optional().nullable(),
});

const createSchema = z.object({
  employeeId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  currency: z.string().optional(),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
});

function toDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const status = searchParams.get("status");

  const where: any = { tenantId: user.tenantId };
  if (mine && user.employeeId) where.employeeId = user.employeeId;
  if (status) where.status = status;

  const claims = await prisma.expenseClaim.findMany({
    where,
    include: {
      employee: true,
      approver: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ claims });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  // Determine employeeId: admins can submit on behalf, employees submit for themselves
  const employeeId = d.employeeId || user.employeeId!;
  if (!user.employeeId && !d.employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  // Verify employee belongs to tenant
  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp || emp.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Employees can only submit for themselves
  if (user.role === UserRole.EMPLOYEE && employeeId !== user.employeeId) {
    return NextResponse.json({ error: "You can only submit expenses for yourself" }, { status: 403 });
  }

  const totalAmount = d.items.reduce((sum, item) => sum + item.amount, 0);

  const claim = await prisma.expenseClaim.create({
    data: {
      tenantId: user.tenantId!,
      employeeId,
      status: ExpenseStatus.SUBMITTED,
      title: d.title,
      description: d.description || null,
      totalAmount,
      currency: normalizeCurrency(d.currency),
      periodStart: toDate(d.periodStart),
      periodEnd: toDate(d.periodEnd),
      submittedAt: new Date(),
      items: {
        create: d.items.map((item) => ({
          category: (item.category as ExpenseCategory) || ExpenseCategory.MISC,
          description: item.description,
          amount: item.amount,
          date: new Date(item.date),
          receiptUrl: item.receiptUrl || null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ claim }, { status: 201 });
}
