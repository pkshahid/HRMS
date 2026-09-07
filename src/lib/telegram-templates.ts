import { formatDate, formatCurrency } from "@/lib/utils";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const HEADER = "🔔 <b>WorkHub</b>\n\n";

// ---------------------------------------------------------------------------
// Leave templates
// ---------------------------------------------------------------------------

export function leaveApprovedTelegram(data: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  approverName: string;
}): string {
  return `${HEADER}✅ <b>Leave Approved</b>

Hi ${data.employeeName}, your leave request has been approved.

📋 <b>Type:</b> ${data.leaveType}
📅 <b>Period:</b> ${data.startDate} → ${data.endDate}
🔢 <b>Days:</b> ${data.days}
👤 <b>Approved by:</b> ${data.approverName}

<a href="${APP_URL}/leaves/me">View Details →</a>`;
}

export function leaveRejectedTelegram(data: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  approverName: string;
  rejectReason: string;
}): string {
  return `${HEADER}❌ <b>Leave Rejected</b>

Hi ${data.employeeName}, your leave request has been rejected.

📋 <b>Type:</b> ${data.leaveType}
📅 <b>Period:</b> ${data.startDate} → ${data.endDate}
👤 <b>Rejected by:</b> ${data.approverName}
💬 <b>Reason:</b> ${data.rejectReason}

<a href="${APP_URL}/leaves/me">View Details →</a>`;
}

export function leavePendingTelegram(data: {
  approverName: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
}): string {
  return `${HEADER}⏳ <b>Leave Approval Pending</b>

Hi ${data.approverName}, a new leave request from ${data.employeeName} needs your approval.

👤 <b>Employee:</b> ${data.employeeName}
📋 <b>Type:</b> ${data.leaveType}
📅 <b>Period:</b> ${data.startDate} → ${data.endDate}
🔢 <b>Days:</b> ${data.days}

<a href="${APP_URL}/leaves">Review Request →</a>`;
}

// ---------------------------------------------------------------------------
// Expense templates
// ---------------------------------------------------------------------------

export function expenseApprovedTelegram(data: {
  employeeName: string;
  title: string;
  amount: string;
  approverName: string;
}): string {
  return `${HEADER}✅ <b>Expense Approved</b>

Hi ${data.employeeName}, your expense claim has been approved.

📝 <b>Claim:</b> ${data.title}
💰 <b>Amount:</b> ${data.amount}
👤 <b>Approved by:</b> ${data.approverName}

<a href="${APP_URL}/expenses/me">View Details →</a>`;
}

export function expenseRejectedTelegram(data: {
  employeeName: string;
  title: string;
  amount: string;
  approverName: string;
  rejectReason: string;
}): string {
  return `${HEADER}❌ <b>Expense Rejected</b>

Hi ${data.employeeName}, your expense claim has been rejected.

📝 <b>Claim:</b> ${data.title}
💰 <b>Amount:</b> ${data.amount}
👤 <b>Rejected by:</b> ${data.approverName}
💬 <b>Reason:</b> ${data.rejectReason}

<a href="${APP_URL}/expenses/me">View Details →</a>`;
}

export function expensePaidTelegram(data: {
  employeeName: string;
  title: string;
  amount: string;
}): string {
  return `${HEADER}💸 <b>Expense Paid</b>

Hi ${data.employeeName}, your expense claim has been paid.

📝 <b>Claim:</b> ${data.title}
💰 <b>Amount:</b> ${data.amount}

<a href="${APP_URL}/expenses/me">View Details →</a>`;
}

// ---------------------------------------------------------------------------
// Advance templates
// ---------------------------------------------------------------------------

export function advanceApprovedTelegram(data: {
  employeeName: string;
  type: string;
  amount: string;
  installments: number;
  monthlyDeduction: string;
  approverName: string;
}): string {
  return `${HEADER}✅ <b>Advance Approved</b>

Hi ${data.employeeName}, your advance payment request has been approved.

📋 <b>Type:</b> ${data.type}
💰 <b>Amount:</b> ${data.amount}
🔢 <b>Installments:</b> ${data.installments}
📅 <b>Monthly Deduction:</b> ${data.monthlyDeduction}
👤 <b>Approved by:</b> ${data.approverName}

<a href="${APP_URL}/advances/me">View Details →</a>`;
}

export function advanceRejectedTelegram(data: {
  employeeName: string;
  type: string;
  amount: string;
  approverName: string;
  rejectReason: string;
}): string {
  return `${HEADER}❌ <b>Advance Rejected</b>

Hi ${data.employeeName}, your advance payment request has been rejected.

📋 <b>Type:</b> ${data.type}
💰 <b>Amount:</b> ${data.amount}
👤 <b>Rejected by:</b> ${data.approverName}
💬 <b>Reason:</b> ${data.rejectReason}

<a href="${APP_URL}/advances/me">View Details →</a>`;
}

export function advanceDisbursedTelegram(data: {
  employeeName: string;
  type: string;
  amount: string;
}): string {
  return `${HEADER}💳 <b>Advance Disbursed</b>

Hi ${data.employeeName}, your advance payment has been disbursed.

📋 <b>Type:</b> ${data.type}
💰 <b>Amount:</b> ${data.amount}

Recovery will begin from the next payroll cycle.

<a href="${APP_URL}/advances/me">View Details →</a>`;
}

// ---------------------------------------------------------------------------
// Payroll templates
// ---------------------------------------------------------------------------

export function payrollPaidTelegram(data: {
  employeeName: string;
  payrollName: string;
  netPay: string;
  period: string;
}): string {
  return `${HEADER}💸 <b>Payroll Processed</b>

Hi ${data.employeeName}, your payroll has been processed and paid.

📋 <b>Payroll:</b> ${data.payrollName}
📅 <b>Period:</b> ${data.period}
💰 <b>Net Pay:</b> ${data.netPay}

<a href="${APP_URL}/payroll/me">View Payslip →</a>`;
}

// ---------------------------------------------------------------------------
// Auth templates
// ---------------------------------------------------------------------------

export function passwordResetTelegram(data: {
  name: string;
  resetUrl: string;
}): string {
  return `${HEADER}🔑 <b>Password Reset Request</b>

Hi ${data.name}, we received a request to reset your password.

<a href="${data.resetUrl}">Reset Password →</a>

⏰ This link will expire in 1 hour. If you didn't request this, you can safely ignore this message.`;
}

export function accountActivationTelegram(data: {
  name: string;
  activationUrl: string;
}): string {
  return `${HEADER}🎉 <b>Activate Your Account</b>

Hi ${data.name}, welcome to WorkHub! Please activate your account:

<a href="${data.activationUrl}">Activate Account →</a>

⏰ This link will expire in 24 hours.`;
}

export function welcomeTelegram(data: {
  name: string;
  loginUrl: string;
}): string {
  return `${HEADER}🎉 <b>Welcome to WorkHub!</b>

Hi ${data.name}, your account has been activated. You can now sign in.

<a href="${data.loginUrl}">Sign In →</a>`;
}

// ---------------------------------------------------------------------------
// Test message
// ---------------------------------------------------------------------------

export function testTelegramMessage(botUsername?: string): string {
  return `${HEADER}🤖 <b>Telegram Test Message</b>

✅ Test successful! Your Telegram bot is working correctly.

<b>Bot:</b> @${botUsername || "unknown"}
<b>Sent at:</b> ${new Date().toISOString()}`;
}
