import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UserRole, AdvanceStatus } from "@prisma/client";
import { notifyAdvanceApproved, notifyAdvanceRejected, notifyAdvanceDisbursed } from "@/lib/notifications";
import { notifyAdvanceApprovedTelegram, notifyAdvanceRejectedTelegram, notifyAdvanceDisbursedTelegram } from "@/lib/telegram-notifications";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const advance = await prisma.advancePayment.findUnique({
    where: { id: params.id },
    include: { employee: true, approver: true },
  });
  if (!advance || advance.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role === UserRole.EMPLOYEE && advance.employeeId !== user.employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ advance });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const body = await req.json();
  const { action, rejectReason, disburseDate, recoveredAmount } = body as {
    action: "approve" | "reject" | "disburse" | "record_recovery" | "cancel";
    rejectReason?: string;
    disburseDate?: string;
    recoveredAmount?: number;
  };

  const advance = await prisma.advancePayment.findUnique({ where: { id: params.id } });
  if (!advance || advance.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canManage = ([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "approve") {
    const updated = await prisma.advancePayment.update({
      where: { id: params.id },
      data: {
        status: AdvanceStatus.APPROVED,
        approverId: user.employeeId,
        approvedAt: new Date(),
      },
      include: { employee: true },
    });
    notifyAdvanceApproved(user.tenantId!, updated.employeeId, user.name || "Administrator", {
      type: updated.type,
      amount: updated.amount,
      currency: updated.currency,
      installments: updated.installments,
      monthlyDeduction: updated.monthlyDeduction,
    }).catch(() => {});
    const emp = await prisma.employee.findUnique({ where: { id: updated.employeeId }, select: { userId: true } });
    notifyAdvanceApprovedTelegram(user.tenantId!, emp?.userId || null, updated.employeeId, user.name || "Administrator", {
      type: updated.type,
      amount: updated.amount,
      currency: updated.currency,
      installments: updated.installments,
      monthlyDeduction: updated.monthlyDeduction,
    }).catch(() => {});
    return NextResponse.json({ advance: updated });
  }

  if (action === "reject") {
    if (!rejectReason) {
      return NextResponse.json({ error: "rejectReason is required" }, { status: 400 });
    }
    const updated = await prisma.advancePayment.update({
      where: { id: params.id },
      data: {
        status: AdvanceStatus.REJECTED,
        approverId: user.employeeId,
        rejectReason,
      },
      include: { employee: true },
    });
    notifyAdvanceRejected(user.tenantId!, updated.employeeId, user.name || "Administrator", {
      type: updated.type,
      amount: updated.amount,
      currency: updated.currency,
      rejectReason,
    }).catch(() => {});
    const emp = await prisma.employee.findUnique({ where: { id: updated.employeeId }, select: { userId: true } });
    notifyAdvanceRejectedTelegram(user.tenantId!, emp?.userId || null, updated.employeeId, user.name || "Administrator", {
      type: updated.type,
      amount: updated.amount,
      currency: updated.currency,
      rejectReason,
    }).catch(() => {});
    return NextResponse.json({ advance: updated });
  }

  if (action === "disburse") {
    const updated = await prisma.advancePayment.update({
      where: { id: params.id },
      data: {
        status: AdvanceStatus.RECOVERING,
        disburseDate: disburseDate ? new Date(disburseDate) : new Date(),
      },
      include: { employee: true },
    });
    notifyAdvanceDisbursed(user.tenantId!, updated.employeeId, {
      type: updated.type,
      amount: updated.amount,
      currency: updated.currency,
    }).catch(() => {});
    const emp = await prisma.employee.findUnique({ where: { id: updated.employeeId }, select: { userId: true } });
    notifyAdvanceDisbursedTelegram(user.tenantId!, emp?.userId || null, updated.employeeId, {
      type: updated.type,
      amount: updated.amount,
      currency: updated.currency,
    }).catch(() => {});
    return NextResponse.json({ advance: updated });
  }

  if (action === "record_recovery") {
    if (recoveredAmount === undefined || recoveredAmount <= 0) {
      return NextResponse.json({ error: "recoveredAmount is required" }, { status: 400 });
    }
    const newRecovered = Number(advance.recoveredAmount) + recoveredAmount;
    const newRemaining = Number(advance.amount) - newRecovered;
    const history = advance.recoveryHistory ? JSON.parse(advance.recoveryHistory as string) : [];
    history.push({ date: new Date().toISOString(), amount: recoveredAmount });
    const isCompleted = newRemaining <= 0;
    const updated = await prisma.advancePayment.update({
      where: { id: params.id },
      data: {
        recoveredAmount: Math.max(0, newRecovered),
        remainingAmount: Math.max(0, newRemaining),
        recoveryHistory: JSON.stringify(history),
        status: isCompleted ? AdvanceStatus.RECOVERED : AdvanceStatus.RECOVERING,
        completedAt: isCompleted ? new Date() : null,
      },
      include: { employee: true },
    });
    return NextResponse.json({ advance: updated });
  }

  if (action === "cancel") {
    const updated = await prisma.advancePayment.update({
      where: { id: params.id },
      data: { status: AdvanceStatus.CANCELLED },
      include: { employee: true },
    });
    return NextResponse.json({ advance: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
