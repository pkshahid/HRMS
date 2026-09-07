import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { testTelegramConnection, sendTestTelegramMessage, getBotInfo } from "@/lib/telegram";

const updateSchema = z.object({
  botToken: z.string().min(1),
  botUsername: z.string().optional().nullable(),
  welcomeMessage: z.string().optional(),
  enabled: z.boolean(),
  notifyLeaveApproval: z.boolean().optional(),
  notifyExpenseApproval: z.boolean().optional(),
  notifyAdvanceApproval: z.boolean().optional(),
  notifyPayroll: z.boolean().optional(),
  notifyPasswordReset: z.boolean().optional(),
  notifyAccountActivation: z.boolean().optional(),
  action: z.enum(["save", "test_connection", "send_test"]).optional(),
  testChatId: z.string().optional(),
});

export async function GET() {
  const user = await requireRole(UserRole.ADMIN);
  const config = await prisma.telegramConfig.findUnique({
    where: { tenantId: user.tenantId! },
  });

  if (!config) {
    return NextResponse.json({ config: null });
  }

  // Don't return the full bot token — mask it
  const token = config.botToken;
  const maskedToken = token.length > 12 ? token.slice(0, 8) + "••••••" + token.slice(-4) : "••••••••";

  return NextResponse.json({
    config: {
      ...config,
      botToken: maskedToken,
      hasToken: true,
    },
  });
}

export async function PUT(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const action = d.action || "save";

  // Handle test connection (doesn't save)
  if (action === "test_connection") {
    const result = await testTelegramConnection(d.botToken);

    if (user.tenantId) {
      const existing = await prisma.telegramConfig.findUnique({ where: { tenantId: user.tenantId } });
      if (existing) {
        await prisma.telegramConfig.update({
          where: { tenantId: user.tenantId },
          data: {
            lastTestAt: new Date(),
            lastTestStatus: result.success ? "success" : "error",
            lastTestError: result.error || null,
            // Auto-fill bot username from API if not set
            ...(result.success && result.botInfo && !existing.botUsername ? { botUsername: result.botInfo.username } : {}),
          },
        });
      }
    }

    return NextResponse.json(result);
  }

  // Handle send test message (saves config first, then sends)
  if (action === "send_test") {
    if (!d.testChatId) {
      return NextResponse.json({ error: "testChatId is required" }, { status: 400 });
    }

    // Handle __KEEP_EXISTING__ marker for bot token
    let botToken = d.botToken;
    if (botToken === "__KEEP_EXISTING__") {
      const existing = await prisma.telegramConfig.findUnique({ where: { tenantId: user.tenantId! } });
      if (!existing) {
        return NextResponse.json({ error: "No existing bot token. Please enter the bot token." }, { status: 400 });
      }
      botToken = existing.botToken;
    }

    const data = {
      botToken,
      botUsername: d.botUsername || null,
      welcomeMessage: d.welcomeMessage || "Welcome to WorkHub Notifications! Your account is now linked.",
      enabled: true, // temporarily enable for test
    };

    await prisma.telegramConfig.upsert({
      where: { tenantId: user.tenantId! },
      create: {
        tenantId: user.tenantId!,
        ...data,
        notifyLeaveApproval: d.notifyLeaveApproval ?? true,
        notifyExpenseApproval: d.notifyExpenseApproval ?? true,
        notifyAdvanceApproval: d.notifyAdvanceApproval ?? true,
        notifyPayroll: d.notifyPayroll ?? true,
        notifyPasswordReset: d.notifyPasswordReset ?? true,
        notifyAccountActivation: d.notifyAccountActivation ?? true,
      },
      update: data,
    });

    const result = await sendTestTelegramMessage(user.tenantId!, d.testChatId);

    await prisma.telegramConfig.update({
      where: { tenantId: user.tenantId! },
      data: {
        lastTestAt: new Date(),
        lastTestStatus: result.success ? "success" : "error",
        lastTestError: result.error || null,
        enabled: d.enabled, // restore the enabled flag from the form
      },
    });

    return NextResponse.json(result);
  }

  // Default: save the config
  // Handle __KEEP_EXISTING__ marker for bot token
  let botToken = d.botToken;
  if (botToken === "__KEEP_EXISTING__") {
    const existing = await prisma.telegramConfig.findUnique({ where: { tenantId: user.tenantId! } });
    if (!existing) {
      return NextResponse.json({ error: "No existing bot token. Please enter the bot token." }, { status: 400 });
    }
    botToken = existing.botToken;
  }

  // If botUsername is not provided, try to fetch it from the API
  let botUsername = d.botUsername || null;
  if (!botUsername && botToken) {
    const botInfo = await getBotInfo(botToken);
    if (botInfo) botUsername = botInfo.username;
  }

  const data = {
    botToken,
    botUsername,
    welcomeMessage: d.welcomeMessage || "Welcome to WorkHub Notifications! Your account is now linked.",
    enabled: d.enabled,
    notifyLeaveApproval: d.notifyLeaveApproval ?? true,
    notifyExpenseApproval: d.notifyExpenseApproval ?? true,
    notifyAdvanceApproval: d.notifyAdvanceApproval ?? true,
    notifyPayroll: d.notifyPayroll ?? true,
    notifyPasswordReset: d.notifyPasswordReset ?? true,
    notifyAccountActivation: d.notifyAccountActivation ?? true,
  };

  const config = await prisma.telegramConfig.upsert({
    where: { tenantId: user.tenantId! },
    create: {
      tenantId: user.tenantId!,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({
    config: {
      ...config,
      botToken: config.botToken.length > 12 ? config.botToken.slice(0, 8) + "••••••" + config.botToken.slice(-4) : "••••••••",
      hasToken: true,
    },
  });
}
