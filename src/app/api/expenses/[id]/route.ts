import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UserRole, ExpenseStatus } from "@prisma/client";
import { notifyExpenseApproved, notifyExpenseRejected, notifyExpensePaid } from "@/lib/notifications";
import { notifyExpenseApprovedTelegram, notifyExpenseRejectedTelegram, notifyExpensePaidTelegram } from "@/lib/telegram-notifications";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const claim = await prisma.expenseClaim.findUnique({
    where: { id: params.id },
    include: { employee: true, approver: true, items: true },
  });
  if (!claim || claim.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // employees can only view their own
  if (user.role === UserRole.EMPLOYEE && claim.employeeId !== user.employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ claim });
}

const actionSchema = {
  approve: { status: ExpenseStatus.APPROVED, needsReason: false },
  reject: { status: ExpenseStatus.REJECTED, needsReason: true },
  pay: { status: ExpenseStatus.PAID, needsReason: false },
  cancel: { status: ExpenseStatus.CANCELLED, needsReason: false },
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const body = await req.json();
  const { action, rejectReason } = body as { action: keyof typeof actionSchema; rejectReason?: string };

  const claim = await prisma.expenseClaim.findUnique({ where: { id: params.id } });
  if (!claim || claim.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only admin/manager/staff can approve/reject/pay
  const canManage = ([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] as UserRole[]).includes(user.role);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!actionSchema[action]) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const cfg = actionSchema[action];
  if (cfg.needsReason && !rejectReason) {
    return NextResponse.json({ error: "rejectReason is required" }, { status: 400 });
  }

  const updateData: any = {
    status: cfg.status,
    approverId: user.employeeId,
  };

  if (action === "approve") updateData.approvedAt = new Date();
  if (action === "reject") updateData.rejectReason = rejectReason;
  if (action === "pay") updateData.paidAt = new Date();

  const updated = await prisma.expenseClaim.update({
    where: { id: params.id },
    data: updateData,
    include: { employee: true, items: true },
  });

  // Send email notification (non-blocking)
  const approverName = user.name || "Administrator";
  const employee = await prisma.employee.findUnique({ where: { id: updated.employeeId }, select: { userId: true } });
  if (action === "approve") {
    notifyExpenseApproved(user.tenantId!, updated.employeeId, approverName, {
      title: updated.title,
      totalAmount: updated.totalAmount,
      currency: updated.currency,
    }).catch(() => {});
    notifyExpenseApprovedTelegram(user.tenantId!, employee?.userId || null, updated.employeeId, approverName, {
      title: updated.title,
      totalAmount: updated.totalAmount,
      currency: updated.currency,
    }).catch(() => {});
  } else if (action === "reject") {
    notifyExpenseRejected(user.tenantId!, updated.employeeId, approverName, {
      title: updated.title,
      totalAmount: updated.totalAmount,
      currency: updated.currency,
      rejectReason: rejectReason || "No reason provided",
    }).catch(() => {});
    notifyExpenseRejectedTelegram(user.tenantId!, employee?.userId || null, updated.employeeId, approverName, {
      title: updated.title,
      totalAmount: updated.totalAmount,
      currency: updated.currency,
      rejectReason: rejectReason || "No reason provided",
    }).catch(() => {});
  } else if (action === "pay") {
    notifyExpensePaid(user.tenantId!, updated.employeeId, {
      title: updated.title,
      totalAmount: updated.totalAmount,
      currency: updated.currency,
    }).catch(() => {});
    notifyExpensePaidTelegram(user.tenantId!, employee?.userId || null, updated.employeeId, {
      title: updated.title,
      totalAmount: updated.totalAmount,
      currency: updated.currency,
    }).catch(() => {});
  }

  return NextResponse.json({ claim: updated });
}
