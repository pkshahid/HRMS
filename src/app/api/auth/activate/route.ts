import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail, isNotificationEnabled } from "@/lib/email";
import { accountActivationTemplate, welcomeTemplate } from "@/lib/email-templates";
import { sendTelegramToUser, isTelegramNotificationEnabled } from "@/lib/telegram";
import { accountActivationTelegram, welcomeTelegram } from "@/lib/telegram-templates";
import { EmailType } from "@prisma/client";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// POST: Send activation email to a user (admin action)
const sendSchema = z.object({
  userId: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { tenant: true },
  });

  if (!user || !user.tenantId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour expiry

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activationToken: token,
      activationTokenExpiry: expiry,
    },
  });

  const activationUrl = `${APP_URL}/activate?token=${token}`;
  let emailSent = false;
  let telegramSent = false;

  // Send email notification if enabled
  const emailEnabled = await isNotificationEnabled(user.tenantId, EmailType.ACCOUNT_ACTIVATION);
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
      tenantId: user.tenantId,
    });
    emailSent = result.success;
  }

  // Send Telegram notification if enabled and user has chat ID
  const telegramEnabled = await isTelegramNotificationEnabled(user.tenantId, EmailType.ACCOUNT_ACTIVATION);
  if (telegramEnabled && user.telegramChatId && user.telegramNotify) {
    const message = accountActivationTelegram({ name: user.name, activationUrl });
    const result = await sendTelegramToUser(user.tenantId, user.id, message, EmailType.ACCOUNT_ACTIVATION);
    telegramSent = result.success;
  }

  if (!emailEnabled && !telegramEnabled) {
    return NextResponse.json({
      error: "Account activation notifications are disabled. Enable SMTP or Telegram in Developer Settings.",
    }, { status: 400 });
  }

  if (!emailSent && !telegramSent) {
    return NextResponse.json({ error: "Failed to send activation notification" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH: Activate account with token + set password
const activateSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input. Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      activationToken: token,
      activationTokenExpiry: { gt: new Date() },
    },
    include: { tenant: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired activation token." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      emailVerifiedAt: new Date(),
      activationToken: null,
      activationTokenExpiry: null,
      isActive: true,
    },
  });

  // Send welcome email
  if (user.tenantId) {
    const welcomeEnabled = await isNotificationEnabled(user.tenantId, EmailType.WELCOME);
    if (welcomeEnabled) {
      const { subject, html } = welcomeTemplate({
        name: user.name,
        loginUrl: `${APP_URL}/login`,
        email: user.email,
        appName: user.tenant?.name,
      });
      await sendEmail({
        to: user.email,
        toName: user.name,
        subject,
        html,
        type: EmailType.WELCOME,
        tenantId: user.tenantId,
      });
    }

    // Send welcome Telegram message
    const telegramWelcomeEnabled = await isTelegramNotificationEnabled(user.tenantId, EmailType.WELCOME);
    if (telegramWelcomeEnabled && user.telegramChatId && user.telegramNotify) {
      const message = welcomeTelegram({ name: user.name, loginUrl: `${APP_URL}/login` });
      await sendTelegramToUser(user.tenantId, user.id, message, EmailType.WELCOME);
    }
  }

  return NextResponse.json({ success: true });
}
