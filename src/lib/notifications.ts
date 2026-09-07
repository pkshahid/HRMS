import { prisma } from "@/lib/prisma";
import { sendEmail, isNotificationEnabled } from "@/lib/email";
import {
  leaveApprovedTemplate,
  leaveRejectedTemplate,
  leavePendingTemplate,
  expenseApprovedTemplate,
  expenseRejectedTemplate,
  expensePaidTemplate,
  advanceApprovedTemplate,
  advanceRejectedTemplate,
  advanceDisbursedTemplate,
  payrollPaidTemplate,
} from "@/lib/email-templates";
import { EmailType } from "@prisma/client";
import { formatDate, formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Leave notifications
// ---------------------------------------------------------------------------

export async function notifyLeaveApproved(
  tenantId: string,
  employeeId: string,
  approverName: string,
  leaveData: { type: string; startDate: Date; endDate: Date; totalDays: number; approverNote?: string | null }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.LEAVE_APPROVED);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = leaveApprovedTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    leaveType: leaveData.type.toLowerCase(),
    startDate: formatDate(leaveData.startDate),
    endDate: formatDate(leaveData.endDate),
    days: leaveData.totalDays,
    approverName,
    approverNote: leaveData.approverNote || undefined,
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.LEAVE_APPROVED,
    tenantId,
  });
}

export async function notifyLeaveRejected(
  tenantId: string,
  employeeId: string,
  approverName: string,
  leaveData: { type: string; startDate: Date; endDate: Date; totalDays: number; rejectReason: string }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.LEAVE_REJECTED);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = leaveRejectedTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    leaveType: leaveData.type.toLowerCase(),
    startDate: formatDate(leaveData.startDate),
    endDate: formatDate(leaveData.endDate),
    days: leaveData.totalDays,
    approverName,
    rejectReason: leaveData.rejectReason,
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.LEAVE_REJECTED,
    tenantId,
  });
}

export async function notifyLeavePending(
  tenantId: string,
  employeeId: string,
  leaveData: { type: string; startDate: Date; endDate: Date; totalDays: number; reason?: string | null }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.LEAVE_PENDING);
  if (!enabled) return;

  // Notify managers/admins of the tenant
  const managers = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ["ADMIN", "MANAGER"] },
      isActive: true,
    },
  });

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  for (const manager of managers) {
    const { subject, html } = leavePendingTemplate({
      approverName: manager.name,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: leaveData.type.toLowerCase(),
      startDate: formatDate(leaveData.startDate),
      endDate: formatDate(leaveData.endDate),
      days: leaveData.totalDays,
      reason: leaveData.reason || undefined,
    });

    await sendEmail({
      to: manager.email,
      toName: manager.name,
      subject,
      html,
      type: EmailType.LEAVE_PENDING,
      tenantId,
    });
  }
}

// ---------------------------------------------------------------------------
// Expense notifications
// ---------------------------------------------------------------------------

export async function notifyExpenseApproved(
  tenantId: string,
  employeeId: string,
  approverName: string,
  expenseData: { title: string; totalAmount: any; currency: string }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.EXPENSE_APPROVED);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = expenseApprovedTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    title: expenseData.title,
    amount: formatCurrency(expenseData.totalAmount, expenseData.currency),
    approverName,
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.EXPENSE_APPROVED,
    tenantId,
  });
}

export async function notifyExpenseRejected(
  tenantId: string,
  employeeId: string,
  approverName: string,
  expenseData: { title: string; totalAmount: any; currency: string; rejectReason: string }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.EXPENSE_REJECTED);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = expenseRejectedTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    title: expenseData.title,
    amount: formatCurrency(expenseData.totalAmount, expenseData.currency),
    approverName,
    rejectReason: expenseData.rejectReason,
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.EXPENSE_REJECTED,
    tenantId,
  });
}

export async function notifyExpensePaid(
  tenantId: string,
  employeeId: string,
  expenseData: { title: string; totalAmount: any; currency: string }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.EXPENSE_PAID);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = expensePaidTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    title: expenseData.title,
    amount: formatCurrency(expenseData.totalAmount, expenseData.currency),
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.EXPENSE_PAID,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Advance notifications
// ---------------------------------------------------------------------------

export async function notifyAdvanceApproved(
  tenantId: string,
  employeeId: string,
  approverName: string,
  advanceData: { type: string; amount: any; currency: string; installments: number; monthlyDeduction: any }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.ADVANCE_APPROVED);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = advanceApprovedTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    type: advanceData.type.replace(/_/g, " ").toLowerCase(),
    amount: formatCurrency(advanceData.amount, advanceData.currency),
    installments: advanceData.installments,
    monthlyDeduction: formatCurrency(advanceData.monthlyDeduction, advanceData.currency),
    approverName,
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.ADVANCE_APPROVED,
    tenantId,
  });
}

export async function notifyAdvanceRejected(
  tenantId: string,
  employeeId: string,
  approverName: string,
  advanceData: { type: string; amount: any; currency: string; rejectReason: string }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.ADVANCE_REJECTED);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = advanceRejectedTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    type: advanceData.type.replace(/_/g, " ").toLowerCase(),
    amount: formatCurrency(advanceData.amount, advanceData.currency),
    approverName,
    rejectReason: advanceData.rejectReason,
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.ADVANCE_REJECTED,
    tenantId,
  });
}

export async function notifyAdvanceDisbursed(
  tenantId: string,
  employeeId: string,
  advanceData: { type: string; amount: any; currency: string }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.ADVANCE_DISBURSED);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = advanceDisbursedTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    type: advanceData.type.replace(/_/g, " ").toLowerCase(),
    amount: formatCurrency(advanceData.amount, advanceData.currency),
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.ADVANCE_DISBURSED,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Payroll notifications
// ---------------------------------------------------------------------------

export async function notifyPayrollPaid(
  tenantId: string,
  employeeId: string,
  payrollData: { name: string; netPay: any; currency: string; periodStart: Date; periodEnd: Date }
) {
  const enabled = await isNotificationEnabled(tenantId, EmailType.PAYROLL_PAID);
  if (!enabled) return;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee?.email) return;

  const { subject, html } = payrollPaidTemplate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    payrollName: payrollData.name,
    netPay: formatCurrency(payrollData.netPay, payrollData.currency),
    period: `${formatDate(payrollData.periodStart)} → ${formatDate(payrollData.periodEnd)}`,
  });

  await sendEmail({
    to: employee.email,
    toName: `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    type: EmailType.PAYROLL_PAID,
    tenantId,
  });
}
