import { prisma } from "@/lib/prisma";
import { sendTelegramToUser, sendTelegramToRole } from "@/lib/telegram";
import {
  leaveApprovedTelegram,
  leaveRejectedTelegram,
  leavePendingTelegram,
  expenseApprovedTelegram,
  expenseRejectedTelegram,
  expensePaidTelegram,
  advanceApprovedTelegram,
  advanceRejectedTelegram,
  advanceDisbursedTelegram,
  payrollPaidTelegram,
} from "@/lib/telegram-templates";
import { EmailType } from "@prisma/client";
import { formatDate, formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Leave notifications
// ---------------------------------------------------------------------------

export async function notifyLeaveApprovedTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  approverName: string,
  leaveData: { type: string; startDate: Date; endDate: Date; totalDays: number }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = leaveApprovedTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    leaveType: leaveData.type.toLowerCase(),
    startDate: formatDate(leaveData.startDate),
    endDate: formatDate(leaveData.endDate),
    days: leaveData.totalDays,
    approverName,
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.LEAVE_APPROVED);
}

export async function notifyLeaveRejectedTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  approverName: string,
  leaveData: { type: string; startDate: Date; endDate: Date; totalDays: number; rejectReason: string }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = leaveRejectedTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    leaveType: leaveData.type.toLowerCase(),
    startDate: formatDate(leaveData.startDate),
    endDate: formatDate(leaveData.endDate),
    approverName,
    rejectReason: leaveData.rejectReason,
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.LEAVE_REJECTED);
}

export async function notifyLeavePendingTelegram(
  tenantId: string,
  employeeId: string,
  leaveData: { type: string; startDate: Date; endDate: Date; totalDays: number }
) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = leavePendingTelegram({
    approverName: "Manager",
    employeeName: `${employee.firstName} ${employee.lastName}`,
    leaveType: leaveData.type.toLowerCase(),
    startDate: formatDate(leaveData.startDate),
    endDate: formatDate(leaveData.endDate),
    days: leaveData.totalDays,
  });

  await sendTelegramToRole(tenantId, ["ADMIN", "MANAGER"], message, EmailType.LEAVE_PENDING);
}

// ---------------------------------------------------------------------------
// Expense notifications
// ---------------------------------------------------------------------------

export async function notifyExpenseApprovedTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  approverName: string,
  expenseData: { title: string; totalAmount: any; currency: string }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = expenseApprovedTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    title: expenseData.title,
    amount: formatCurrency(expenseData.totalAmount, expenseData.currency),
    approverName,
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.EXPENSE_APPROVED);
}

export async function notifyExpenseRejectedTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  approverName: string,
  expenseData: { title: string; totalAmount: any; currency: string; rejectReason: string }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = expenseRejectedTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    title: expenseData.title,
    amount: formatCurrency(expenseData.totalAmount, expenseData.currency),
    approverName,
    rejectReason: expenseData.rejectReason,
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.EXPENSE_REJECTED);
}

export async function notifyExpensePaidTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  expenseData: { title: string; totalAmount: any; currency: string }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = expensePaidTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    title: expenseData.title,
    amount: formatCurrency(expenseData.totalAmount, expenseData.currency),
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.EXPENSE_PAID);
}

// ---------------------------------------------------------------------------
// Advance notifications
// ---------------------------------------------------------------------------

export async function notifyAdvanceApprovedTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  approverName: string,
  advanceData: { type: string; amount: any; currency: string; installments: number; monthlyDeduction: any }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = advanceApprovedTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    type: advanceData.type.replace(/_/g, " ").toLowerCase(),
    amount: formatCurrency(advanceData.amount, advanceData.currency),
    installments: advanceData.installments,
    monthlyDeduction: formatCurrency(advanceData.monthlyDeduction, advanceData.currency),
    approverName,
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.ADVANCE_APPROVED);
}

export async function notifyAdvanceRejectedTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  approverName: string,
  advanceData: { type: string; amount: any; currency: string; rejectReason: string }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = advanceRejectedTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    type: advanceData.type.replace(/_/g, " ").toLowerCase(),
    amount: formatCurrency(advanceData.amount, advanceData.currency),
    approverName,
    rejectReason: advanceData.rejectReason,
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.ADVANCE_REJECTED);
}

export async function notifyAdvanceDisbursedTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  advanceData: { type: string; amount: any; currency: string }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = advanceDisbursedTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    type: advanceData.type.replace(/_/g, " ").toLowerCase(),
    amount: formatCurrency(advanceData.amount, advanceData.currency),
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.ADVANCE_DISBURSED);
}

// ---------------------------------------------------------------------------
// Payroll notifications
// ---------------------------------------------------------------------------

export async function notifyPayrollPaidTelegram(
  tenantId: string,
  employeeUserId: string | null,
  employeeId: string,
  payrollData: { name: string; netPay: any; currency: string; periodStart: Date; periodEnd: Date }
) {
  if (!employeeUserId) return;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const message = payrollPaidTelegram({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    payrollName: payrollData.name,
    netPay: formatCurrency(payrollData.netPay, payrollData.currency),
    period: `${formatDate(payrollData.periodStart)} → ${formatDate(payrollData.periodEnd)}`,
  });

  await sendTelegramToUser(tenantId, employeeUserId, message, EmailType.PAYROLL_PAID);
}
