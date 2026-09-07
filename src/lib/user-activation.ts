import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, isNotificationEnabled } from "@/lib/email";
import { accountActivationTemplate } from "@/lib/email-templates";
import { sendTelegramToUser, isTelegramNotificationEnabled } from "@/lib/telegram";
import { accountActivationTelegram } from "@/lib/telegram-templates";
import { EmailType } from "@prisma/client";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Send activation email/telegram to a user
// ---------------------------------------------------------------------------

export async function sendActivationEmail(userId: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });

  if (!user || !user.tenantId) {
    return { success: false, error: "User not found or no tenant" };
  }

  // Generate activation token
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activationToken: token,
      activationTokenExpiry: expiry,
    },
  });

  const activationUrl = `${APP_URL}/activate?token=${token}`;
  let sent = false;

  // Send email if enabled
  const emailEnabled = await isNotificationEnabled(tenantId, EmailType.ACCOUNT_ACTIVATION);
  if (emailEnabled) {
    const { subject, html } = accountActivationTemplate({
      name: user.name,
      activationUrl,
      appName: user.tenant?.name,
    });
    const result = await sendEmail({
      to: user.email,
      toName: user.name,
      subject,
      html,
      type: EmailType.ACCOUNT_ACTIVATION,
      tenantId,
    });
    if (result.success) sent = true;
  }

  // Send Telegram if enabled and user has chat ID
  const telegramEnabled = await isTelegramNotificationEnabled(tenantId, EmailType.ACCOUNT_ACTIVATION);
  if (telegramEnabled && user.telegramChatId && user.telegramNotify) {
    const message = accountActivationTelegram({ name: user.name, activationUrl });
    const result = await sendTelegramToUser(tenantId, user.id, message, EmailType.ACCOUNT_ACTIVATION);
    if (result.success) sent = true;
  }

  if (!sent) {
    return { success: false, error: "No notification channel enabled (SMTP/Telegram)" };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin-initiated password reset — sends a reset link
// ---------------------------------------------------------------------------

export async function sendPasswordResetByAdmin(userId: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });

  if (!user || !user.tenantId) {
    return { success: false, error: "User not found or no tenant" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  });

  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  let sent = false;

  // Send email
  const emailEnabled = await isNotificationEnabled(tenantId, EmailType.PASSWORD_RESET);
  if (emailEnabled) {
    const { passwordResetTemplate } = await import("@/lib/email-templates");
    const { subject, html } = passwordResetTemplate({
      name: user.name,
      resetUrl,
      appName: user.tenant?.name,
    });
    const result = await sendEmail({
      to: user.email,
      toName: user.name,
      subject,
      html,
      type: EmailType.PASSWORD_RESET,
      tenantId,
    });
    if (result.success) sent = true;
  }

  // Send Telegram
  const telegramEnabled = await isTelegramNotificationEnabled(tenantId, EmailType.PASSWORD_RESET);
  if (telegramEnabled && user.telegramChatId && user.telegramNotify) {
    const { passwordResetTelegram } = await import("@/lib/telegram-templates");
    const message = passwordResetTelegram({ name: user.name, resetUrl });
    const result = await sendTelegramToUser(tenantId, user.id, message, EmailType.PASSWORD_RESET);
    if (result.success) sent = true;
  }

  if (!sent) {
    return { success: false, error: "No notification channel enabled" };
  }

  return { success: true };
}
