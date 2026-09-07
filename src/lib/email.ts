import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { EmailType, EmailStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SendEmailParams = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  type: EmailType;
  tenantId?: string;
};

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  enabled: boolean;
};

// ---------------------------------------------------------------------------
// Get SMTP config for a tenant
// ---------------------------------------------------------------------------

export async function getSmtpConfig(tenantId: string): Promise<SmtpSettings | null> {
  const config = await prisma.smtpConfig.findUnique({
    where: { tenantId },
  });
  if (!config) return null;
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    username: config.username,
    password: config.password,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyTo: config.replyTo,
    enabled: config.enabled,
  };
}

// ---------------------------------------------------------------------------
// Create a nodemailer transporter from SMTP settings
// ---------------------------------------------------------------------------

function createTransport(smtp: SmtpSettings) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
  } as nodemailer.TransportOptions);
}

// ---------------------------------------------------------------------------
// Send an email and log the result
// ---------------------------------------------------------------------------

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const { to, toName, subject, html, text, type, tenantId } = params;

  // Create a pending log entry
  const log = await prisma.emailLog.create({
    data: {
      tenantId: tenantId || null,
      type,
      status: EmailStatus.PENDING,
      toEmail: to,
      toName: toName || null,
      subject,
      body: html,
    },
  });

  try {
    if (!tenantId) {
      throw new Error("No tenant context for email");
    }

    const smtp = await getSmtpConfig(tenantId);
    if (!smtp) {
      throw new Error("SMTP not configured for this tenant");
    }
    if (!smtp.enabled) {
      throw new Error("SMTP is disabled in settings");
    }

    const transport = createTransport(smtp);
    const from = `"${smtp.fromName}" <${smtp.fromEmail}>`;

    const info = await transport.sendMail({
      from,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
      replyTo: smtp.replyTo || undefined,
    });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: error?.message || String(error),
      },
    });
    return { success: false, error: error?.message || String(error) };
  }
}

// ---------------------------------------------------------------------------
// Test SMTP connection
// ---------------------------------------------------------------------------

export async function testSmtpConnection(smtp: SmtpSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = createTransport(smtp);
    await transport.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}

// ---------------------------------------------------------------------------
// Send a test email
// ---------------------------------------------------------------------------

export async function sendTestEmail(
  tenantId: string,
  toEmail: string
): Promise<{ success: boolean; error?: string }> {
  const smtp = await getSmtpConfig(tenantId);
  if (!smtp) return { success: false, error: "SMTP not configured" };

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">WorkHub</h1>
        <p style="margin: 4px 0 0; opacity: 0.9;">SMTP Test Email</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1b1f23; margin-top: 0;">Test Successful!</h2>
        <p style="color: #6b7280; line-height: 1.6;">
          This is a test email from your WorkHub instance. If you received this message,
          your SMTP configuration is working correctly.
        </p>
        <table style="width: 100%; margin: 20px 0; font-size: 14px;">
          <tr><td style="color: #9ca3af; padding: 4px 0;">SMTP Host:</td><td style="color: #1b1f23; font-weight: 500;">${smtp.host}:${smtp.port}</td></tr>
          <tr><td style="color: #9ca3af; padding: 4px 0;">From:</td><td style="color: #1b1f23; font-weight: 500;">${smtp.fromName} &lt;${smtp.fromEmail}&gt;</td></tr>
          <tr><td style="color: #9ca3af; padding: 4px 0;">Sent at:</td><td style="color: #1b1f23; font-weight: 500;">${new Date().toISOString()}</td></tr>
        </table>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
          This is an automated message from WorkHub. Please do not reply.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: "WorkHub — SMTP Test Email",
    html,
    type: EmailType.TEST,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Check if a notification type is enabled
// ---------------------------------------------------------------------------

export async function isNotificationEnabled(
  tenantId: string,
  type: EmailType
): Promise<boolean> {
  const config = await prisma.smtpConfig.findUnique({
    where: { tenantId },
  });
  if (!config || !config.enabled) return false;

  const typeToFlag: Record<EmailType, boolean> = {
    LEAVE_APPROVED: config.notifyLeaveApproval,
    LEAVE_REJECTED: config.notifyLeaveApproval,
    LEAVE_PENDING: config.notifyLeaveApproval,
    EXPENSE_APPROVED: config.notifyExpenseApproval,
    EXPENSE_REJECTED: config.notifyExpenseApproval,
    EXPENSE_PAID: config.notifyExpenseApproval,
    ADVANCE_APPROVED: config.notifyAdvanceApproval,
    ADVANCE_REJECTED: config.notifyAdvanceApproval,
    ADVANCE_DISBURSED: config.notifyAdvanceApproval,
    ADVANCE_RECOVERY: config.notifyAdvanceApproval,
    PAYROLL_GENERATED: config.notifyPayroll,
    PAYROLL_PAID: config.notifyPayroll,
    PASSWORD_RESET: config.notifyPasswordReset,
    ACCOUNT_ACTIVATION: config.notifyAccountActivation,
    WELCOME: config.notifyAccountActivation,
    TEST: true,
    CUSTOM: true,
  };

  return typeToFlag[type] ?? false;
}
