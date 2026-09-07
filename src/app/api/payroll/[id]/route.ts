import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, PayrollStatus } from "@prisma/client";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER);
  const payroll = await prisma.payroll.findUnique({
    where: { id: ctx.params.id },
    include: { items: { include: { employee: true } } },
  });
  if (!payroll || payroll.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ payroll });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const body = await req.json();
  const payroll = await prisma.payroll.findUnique({ where: { id: ctx.params.id } });
  if (!payroll || payroll.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = body.status as PayrollStatus;
  if (!["DRAFT", "PROCESSING", "APPROVED", "PAID", "CANCELLED"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.payroll.update({
    where: { id: ctx.params.id },
    data: { status: newStatus, payDate: newStatus === "PAID" ? new Date() : payroll.payDate },
  });

  if (newStatus === "PAID") {
    await prisma.payrollItem.updateMany({ where: { payrollId: ctx.params.id }, data: { status: "paid" } });
  }

  return NextResponse.json({ payroll: updated });
}
