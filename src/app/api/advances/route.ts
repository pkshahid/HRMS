import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UserRole, AdvanceType, AdvanceStatus } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  employeeId: z.string().optional(),
  type: z.enum(["SALARY_ADVANCE", "LOAN", "PETTY_CASH", "RELOCATION", "MEDICAL", "OTHER"]).optional(),
  amount: z.number().positive(),
  currency: z.string().optional(),
  reason: z.string().optional().nullable(),
  installments: z.number().int().min(1).max(60).optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const status = searchParams.get("status");

  const where: any = { tenantId: user.tenantId };
  if (mine && user.employeeId) where.employeeId = user.employeeId;
  if (status) where.status = status;

  const advances = await prisma.advancePayment.findMany({
    where,
    include: { employee: true, approver: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ advances });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const employeeId = d.employeeId || user.employeeId!;
  if (!user.employeeId && !d.employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp || emp.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  if (user.role === UserRole.EMPLOYEE && employeeId !== user.employeeId) {
    return NextResponse.json({ error: "You can only request advances for yourself" }, { status: 403 });
  }

  const installments = d.installments ?? 1;
  const installmentAmount = Math.round((d.amount / installments) * 100) / 100;

  const advance = await prisma.advancePayment.create({
    data: {
      tenantId: user.tenantId!,
      employeeId,
      type: (d.type as AdvanceType) || AdvanceType.SALARY_ADVANCE,
      status: AdvanceStatus.PENDING,
      amount: d.amount,
      currency: d.currency || "AED",
      reason: d.reason || null,
      installments,
      installmentAmount,
      recoveredAmount: 0,
      remainingAmount: d.amount,
      monthlyDeduction: installmentAmount,
    },
  });

  return NextResponse.json({ advance }, { status: 201 });
}
