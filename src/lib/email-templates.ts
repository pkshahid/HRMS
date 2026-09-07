import { EmailType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Email template helpers
// ---------------------------------------------------------------------------

function baseLayout(title: string, content: string, appName = "WorkHub"): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">${appName}</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1b1f23; margin-top: 0;">${title}</h2>
        ${content}
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
          This is an automated message from ${appName}. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 16px 0;">${text}</a>`;
}

function infoRow(label: string, value: string): string {
  return `<tr><td style="color: #9ca3af; padding: 4px 16px 4px 0;">${label}:</td><td style="color: #1b1f23; font-weight: 500;">${value}</td></tr>`;
}

function infoTable(rows: string[]): string {
  return `<table style="margin: 16px 0; font-size: 14px;">${rows.join("")}</table>`;
}

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Template functions
// ---------------------------------------------------------------------------

export function leaveApprovedTemplate(data: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  approverName: string;
  approverNote?: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your leave request has been <strong style="color: #059669;">approved</strong>.</p>
    ${infoTable([
      infoRow("Leave Type", data.leaveType),
      infoRow("Period", `${data.startDate} → ${data.endDate}`),
      infoRow("Days", String(data.days)),
      infoRow("Approved By", data.approverName),
    ])}
    ${data.approverNote ? `<p style="color: #6b7280; line-height: 1.6;"><strong>Note:</strong> ${data.approverNote}</p>` : ""}
    ${button("View Leave Details", `${APP_URL}/leaves/me`)}
  `;
  return {
    subject: `Leave Approved — ${data.leaveType} (${data.startDate} → ${data.endDate})`,
    html: baseLayout("Leave Request Approved", content, data.appName),
  };
}

export function leaveRejectedTemplate(data: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  approverName: string;
  rejectReason: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your leave request has been <strong style="color: #dc2626;">rejected</strong>.</p>
    ${infoTable([
      infoRow("Leave Type", data.leaveType),
      infoRow("Period", `${data.startDate} → ${data.endDate}`),
      infoRow("Days", String(data.days)),
      infoRow("Rejected By", data.approverName),
    ])}
    <p style="color: #6b7280; line-height: 1.6;"><strong>Reason:</strong> ${data.rejectReason}</p>
    ${button("View Leave Details", `${APP_URL}/leaves/me`)}
  `;
  return {
    subject: `Leave Rejected — ${data.leaveType} (${data.startDate} → ${data.endDate})`,
    html: baseLayout("Leave Request Rejected", content, data.appName),
  };
}

export function leavePendingTemplate(data: {
  approverName: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.approverName},</p>
    <p style="color: #6b7280; line-height: 1.6;">A new leave request from <strong>${data.employeeName}</strong> is pending your approval.</p>
    ${infoTable([
      infoRow("Employee", data.employeeName),
      infoRow("Leave Type", data.leaveType),
      infoRow("Period", `${data.startDate} → ${data.endDate}`),
      infoRow("Days", String(data.days)),
    ])}
    ${data.reason ? `<p style="color: #6b7280; line-height: 1.6;"><strong>Reason:</strong> ${data.reason}</p>` : ""}
    ${button("Review Request", `${APP_URL}/leaves`)}
  `;
  return {
    subject: `Leave Approval Pending — ${data.employeeName} (${data.leaveType})`,
    html: baseLayout("Leave Approval Required", content, data.appName),
  };
}

export function expenseApprovedTemplate(data: {
  employeeName: string;
  title: string;
  amount: string;
  approverName: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your expense claim has been <strong style="color: #059669;">approved</strong>.</p>
    ${infoTable([
      infoRow("Claim", data.title),
      infoRow("Amount", data.amount),
      infoRow("Approved By", data.approverName),
    ])}
    ${button("View Expense", `${APP_URL}/expenses/me`)}
  `;
  return {
    subject: `Expense Approved — ${data.title} (${data.amount})`,
    html: baseLayout("Expense Claim Approved", content, data.appName),
  };
}

export function expenseRejectedTemplate(data: {
  employeeName: string;
  title: string;
  amount: string;
  approverName: string;
  rejectReason: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your expense claim has been <strong style="color: #dc2626;">rejected</strong>.</p>
    ${infoTable([
      infoRow("Claim", data.title),
      infoRow("Amount", data.amount),
      infoRow("Rejected By", data.approverName),
    ])}
    <p style="color: #6b7280; line-height: 1.6;"><strong>Reason:</strong> ${data.rejectReason}</p>
    ${button("View Expense", `${APP_URL}/expenses/me`)}
  `;
  return {
    subject: `Expense Rejected — ${data.title}`,
    html: baseLayout("Expense Claim Rejected", content, data.appName),
  };
}

export function expensePaidTemplate(data: {
  employeeName: string;
  title: string;
  amount: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your expense claim has been <strong style="color: #059669;">paid</strong>.</p>
    ${infoTable([
      infoRow("Claim", data.title),
      infoRow("Amount", data.amount),
    ])}
    ${button("View Expense", `${APP_URL}/expenses/me`)}
  `;
  return {
    subject: `Expense Paid — ${data.title} (${data.amount})`,
    html: baseLayout("Expense Reimbursed", content, data.appName),
  };
}

export function advanceApprovedTemplate(data: {
  employeeName: string;
  type: string;
  amount: string;
  installments: number;
  monthlyDeduction: string;
  approverName: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your advance payment request has been <strong style="color: #059669;">approved</strong>.</p>
    ${infoTable([
      infoRow("Type", data.type),
      infoRow("Amount", data.amount),
      infoRow("Installments", String(data.installments)),
      infoRow("Monthly Deduction", data.monthlyDeduction),
      infoRow("Approved By", data.approverName),
    ])}
    ${button("View Advance", `${APP_URL}/advances/me`)}
  `;
  return {
    subject: `Advance Approved — ${data.type} (${data.amount})`,
    html: baseLayout("Advance Payment Approved", content, data.appName),
  };
}

export function advanceRejectedTemplate(data: {
  employeeName: string;
  type: string;
  amount: string;
  approverName: string;
  rejectReason: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your advance payment request has been <strong style="color: #dc2626;">rejected</strong>.</p>
    ${infoTable([
      infoRow("Type", data.type),
      infoRow("Amount", data.amount),
      infoRow("Rejected By", data.approverName),
    ])}
    <p style="color: #6b7280; line-height: 1.6;"><strong>Reason:</strong> ${data.rejectReason}</p>
    ${button("View Advance", `${APP_URL}/advances/me`)}
  `;
  return {
    subject: `Advance Rejected — ${data.type}`,
    html: baseLayout("Advance Payment Rejected", content, data.appName),
  };
}

export function advanceDisbursedTemplate(data: {
  employeeName: string;
  type: string;
  amount: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your advance payment has been <strong style="color: #4f46e5;">disbursed</strong>.</p>
    ${infoTable([
      infoRow("Type", data.type),
      infoRow("Amount", data.amount),
    ])}
    <p style="color: #6b7280; line-height: 1.6;">Recovery will begin from the next payroll cycle.</p>
    ${button("View Advance", `${APP_URL}/advances/me`)}
  `;
  return {
    subject: `Advance Disbursed — ${data.type} (${data.amount})`,
    html: baseLayout("Advance Payment Disbursed", content, data.appName),
  };
}

export function payrollPaidTemplate(data: {
  employeeName: string;
  payrollName: string;
  netPay: string;
  period: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.employeeName},</p>
    <p style="color: #6b7280; line-height: 1.6;">Your payroll for <strong>${data.payrollName}</strong> has been processed and paid.</p>
    ${infoTable([
      infoRow("Payroll", data.payrollName),
      infoRow("Period", data.period),
      infoRow("Net Pay", data.netPay),
    ])}
    ${button("View Payslip", `${APP_URL}/payroll/me`)}
  `;
  return {
    subject: `Payslip Available — ${data.payrollName}`,
    html: baseLayout("Payroll Processed", content, data.appName),
  };
}

export function passwordResetTemplate(data: {
  name: string;
  resetUrl: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.name},</p>
    <p style="color: #6b7280; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
    ${button("Reset Password", data.resetUrl)}
    <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
  `;
  return {
    subject: "Password Reset Request",
    html: baseLayout("Reset Your Password", content, data.appName),
  };
}

export function accountActivationTemplate(data: {
  name: string;
  activationUrl: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.name},</p>
    <p style="color: #6b7280; line-height: 1.6;">Welcome! Your account has been created. Please activate your account by clicking the button below:</p>
    ${button("Activate Account", data.activationUrl)}
    <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
      This link will expire in 24 hours. If you didn't expect this email, please contact your administrator.
    </p>
  `;
  return {
    subject: "Activate Your WorkHub Account",
    html: baseLayout("Welcome to WorkHub", content, data.appName),
  };
}

export function welcomeTemplate(data: {
  name: string;
  loginUrl: string;
  email: string;
  appName?: string;
}): { subject: string; html: string } {
  const content = `
    <p style="color: #6b7280; line-height: 1.6;">Hi ${data.name},</p>
    <p style="color: #6b7280; line-height: 1.6;">Welcome to WorkHub! Your account is now active.</p>
    ${infoTable([
      infoRow("Email", data.email),
    ])}
    ${button("Sign In", data.loginUrl)}
    <p style="color: #6b7280; line-height: 1.6;">If you have any questions, please contact your administrator.</p>
  `;
  return {
    subject: "Welcome to WorkHub!",
    html: baseLayout("Account Activated", content, data.appName),
  };
}

// ---------------------------------------------------------------------------
// Template registry — maps EmailType to template function
// ---------------------------------------------------------------------------

export const TEMPLATE_REGISTRY = {
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
  passwordResetTemplate,
  accountActivationTemplate,
  welcomeTemplate,
};
