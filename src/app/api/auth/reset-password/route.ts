import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail, isNotificationEnabled } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/email-templates";
import { sendTelegramToUser, isTelegramNotificationEnabled } from "@/lib/telegram";
import { passwordResetTelegram } from "@/lib/telegram-templates";
import { EmailType } from "@prisma/client";

const requestSchema = z.object({
  email: z.string().email(),
});

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });

  // Always return success to prevent email enumeration
  if (!user || !user.isActive || !user.tenantId) {
    return NextResponse.json({ success: true });
  }

  // Generate reset token
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  });

  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  // Send email notification if enabled
  const emailEnabled = await isNotificationEnabled(user.tenantId, EmailType.PASSWORD_RESET);
  if (emailEnabled) {
    const { subject, html } = passwordResetTemplate({
      name: user.name,
      resetUrl,
      appName: user.tenant?.name,
    });
    await sendEmail({
      to: user.email,
      toName: user.name,
      subject,
      html,
      type: EmailType.PASSWORD_RESET,
      tenantId: user.tenantId,
    });
  }

  // Send Telegram notification if enabled and user has chat ID
  const telegramEnabled = await isTelegramNotificationEnabled(user.tenantId, EmailType.PASSWORD_RESET);
  if (telegramEnabled && user.telegramChatId && user.telegramNotify) {
    const message = passwordResetTelegram({ name: user.name, resetUrl });
    await sendTelegramToUser(user.tenantId, user.id, message, EmailType.PASSWORD_RESET);
  }

  if (!emailEnabled && !telegramEnabled) {
    return NextResponse.json({
      success: true,
      message: "Password reset notifications are disabled. Please contact your administrator.",
    });
  }

  return NextResponse.json({ success: true });
}
