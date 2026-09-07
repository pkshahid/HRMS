import { prisma } from "@/lib/prisma";
import { EmailType, TelegramStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TelegramSettings = {
  botToken: string;
  botUsername: string | null;
  welcomeMessage: string;
  enabled: boolean;
  notifyLeaveApproval: boolean;
  notifyExpenseApproval: boolean;
  notifyAdvanceApproval: boolean;
  notifyPayroll: boolean;
  notifyPasswordReset: boolean;
  notifyAccountActivation: boolean;
};

export type SendTelegramParams = {
  chatId: string;
  toName?: string;
  message: string;
  type: EmailType;
  tenantId?: string;
};

// ---------------------------------------------------------------------------
// Telegram Bot API helpers (using fetch — no extra dependencies needed)
// ---------------------------------------------------------------------------

const TELEGRAM_API_BASE = "https://api.telegram.org";

async function telegramApiCall(botToken: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram API error: ${method}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Get Telegram config for a tenant
// ---------------------------------------------------------------------------

export async function getTelegramConfig(tenantId: string): Promise<TelegramSettings | null> {
  const config = await prisma.telegramConfig.findUnique({
    where: { tenantId },
  });
  if (!config) return null;
  return {
    botToken: config.botToken,
    botUsername: config.botUsername,
    welcomeMessage: config.welcomeMessage,
    enabled: config.enabled,
    notifyLeaveApproval: config.notifyLeaveApproval,
    notifyExpenseApproval: config.notifyExpenseApproval,
    notifyAdvanceApproval: config.notifyAdvanceApproval,
    notifyPayroll: config.notifyPayroll,
    notifyPasswordReset: config.notifyPasswordReset,
    notifyAccountActivation: config.notifyAccountActivation,
  };
}

// ---------------------------------------------------------------------------
// Send a Telegram message and log the result
// ---------------------------------------------------------------------------

export async function sendTelegramMessage(params: SendTelegramParams): Promise<{ success: boolean; error?: string }> {
  const { chatId, toName, message, type, tenantId } = params;

  const log = await prisma.telegramLog.create({
    data: {
      tenantId: tenantId || null,
      type,
      status: TelegramStatus.PENDING,
      chatId,
      toName: toName || null,
      message,
    },
  });

  try {
    if (!tenantId) throw new Error("No tenant context for Telegram message");

    const config = await getTelegramConfig(tenantId);
    if (!config) throw new Error("Telegram not configured for this tenant");
    if (!config.enabled) throw new Error("Telegram is disabled in settings");

    await telegramApiCall(config.botToken, "sendMessage", {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    await prisma.telegramLog.update({
      where: { id: log.id },
      data: { status: TelegramStatus.SENT, sentAt: new Date() },
    });

    return { success: true };
  } catch (error: any) {
    await prisma.telegramLog.update({
      where: { id: log.id },
      data: {
        status: TelegramStatus.FAILED,
        errorMessage: error?.message || String(error),
      },
    });
    return { success: false, error: error?.message || String(error) };
  }
}

// ---------------------------------------------------------------------------
// Test Telegram bot connection (getMe)
// ---------------------------------------------------------------------------

export async function testTelegramConnection(botToken: string): Promise<{ success: boolean; error?: string; botInfo?: { username: string; firstName: string; id: number } }> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getMe`);
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.description || "Invalid bot token");
    }
    return {
      success: true,
      botInfo: {
        username: data.result.username,
        firstName: data.result.first_name,
        id: data.result.id,
      },
    };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}

// ---------------------------------------------------------------------------
// Send a test message to a specific chat ID
// ---------------------------------------------------------------------------

export async function sendTestTelegramMessage(
  tenantId: string,
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  const config = await getTelegramConfig(tenantId);
  if (!config) return { success: false, error: "Telegram not configured" };

  const message = `
<b>🤖 WorkHub Telegram Test</b>

✅ <b>Test Successful!</b>

This is a test message from your WorkHub instance. If you received this message, your Telegram bot configuration is working correctly.

<b>Bot:</b> @${config.botUsername || "unknown"}
<b>Sent at:</b> ${new Date().toISOString()}
  `.trim();

  return sendTelegramMessage({
    chatId,
    message,
    type: EmailType.TEST,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Get bot info (for the settings page — shows bot name/username)
// ---------------------------------------------------------------------------

export async function getBotInfo(botToken: string): Promise<{ username: string; firstName: string; id: number } | null> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getMe`);
    const data = await res.json();
    if (!data.ok) return null;
    return {
      username: data.result.username,
      firstName: data.result.first_name,
      id: data.result.id,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Generate a deep-link URL for the bot (users click to start a chat)
// ---------------------------------------------------------------------------

export function getBotDeepLink(botUsername: string, payload?: string): string {
  const base = `https://t.me/${botUsername}`;
  if (payload) {
    return `${base}?start=${encodeURIComponent(payload)}`;
  }
  return `${base}?start=link`;
}

// ---------------------------------------------------------------------------
// Check if a notification type is enabled for Telegram
// ---------------------------------------------------------------------------

export async function isTelegramNotificationEnabled(
  tenantId: string,
  type: EmailType
): Promise<boolean> {
  const config = await prisma.telegramConfig.findUnique({
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

// ---------------------------------------------------------------------------
// Send notification to a user via Telegram (if they have a chat ID and opted in)
// ---------------------------------------------------------------------------

export async function sendTelegramToUser(
  tenantId: string,
  userId: string,
  message: string,
  type: EmailType
): Promise<{ success: boolean; error?: string; skipped?: boolean; reason?: string }> {
  const enabled = await isTelegramNotificationEnabled(tenantId, type);
  if (!enabled) return { success: false, skipped: true, reason: "Notification type disabled" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, skipped: true, reason: "User not found" };
  if (!user.telegramChatId) return { success: false, skipped: true, reason: "No Telegram chat ID" };
  if (!user.telegramNotify) return { success: false, skipped: true, reason: "User opted out" };
  if (!user.isActive) return { success: false, skipped: true, reason: "User inactive" };

  return sendTelegramMessage({
    chatId: user.telegramChatId,
    toName: user.name,
    message,
    type,
    tenantId,
  });
}

// ---------------------------------------------------------------------------
// Send notification to multiple users (e.g., all managers)
// ---------------------------------------------------------------------------

export async function sendTelegramToRole(
  tenantId: string,
  roles: string[],
  message: string,
  type: EmailType
): Promise<void> {
  const enabled = await isTelegramNotificationEnabled(tenantId, type);
  if (!enabled) return;

  const users = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: roles as any },
      isActive: true,
      telegramChatId: { not: null },
      telegramNotify: true,
    },
  });

  for (const user of users) {
    await sendTelegramMessage({
      chatId: user.telegramChatId!,
      toName: user.name,
      message,
      type,
      tenantId,
    });
  }
}
