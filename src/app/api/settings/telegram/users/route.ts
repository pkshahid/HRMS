import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { getTelegramConfig, sendTelegramMessage, getBotDeepLink } from "@/lib/telegram";
import { testTelegramMessage } from "@/lib/telegram-templates";
import { EmailType } from "@prisma/client";

// GET: List users with their Telegram linking status (admin only)
export async function GET(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN);
  const { searchParams } = new URL(req.url);
  const linkedOnly = searchParams.get("linked") === "true";

  const where: any = {
    tenantId: user.tenantId,
    isActive: true,
  };
  if (linkedOnly) {
    where.telegramChatId = { not: null };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      telegramChatId: true,
      telegramUsername: true,
      telegramNotify: true,
      employee: {
        select: { firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const config = await prisma.telegramConfig.findUnique({
    where: { tenantId: user.tenantId! },
  });

  return NextResponse.json({
    users,
    botUsername: config?.botUsername || null,
    enabled: config?.enabled || false,
  });
}

// PUT: Admin sets a user's Telegram chat ID
const updateSchema = z.object({
  userId: z.string(),
  telegramChatId: z.string().nullable(),
  telegramUsername: z.string().nullable().optional(),
  telegramNotify: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { userId, telegramChatId, telegramUsername, telegramNotify } = parsed.data;

  // Verify the target user is in the same tenant
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      telegramChatId: telegramChatId || null,
      telegramUsername: telegramUsername || null,
      telegramNotify: telegramNotify ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      telegramChatId: true,
      telegramUsername: true,
      telegramNotify: true,
    },
  });

  return NextResponse.json({ user: updated });
}

// PATCH: User updates their own Telegram settings
const selfUpdateSchema = z.object({
  telegramChatId: z.string().nullable().optional(),
  telegramUsername: z.string().nullable().optional(),
  telegramNotify: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await requireAuth();
  const body = await req.json();
  const parsed = selfUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: parsed.data.telegramChatId ?? undefined,
      telegramUsername: parsed.data.telegramUsername ?? undefined,
      telegramNotify: parsed.data.telegramNotify ?? undefined,
    },
    select: {
      id: true,
      telegramChatId: true,
      telegramUsername: true,
      telegramNotify: true,
    },
  });

  return NextResponse.json({ user: updated });
}

// POST: Send a test message to a specific user (admin action)
const testSchema = z.object({
  userId: z.string(),
});

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN);
  const body = await req.json();
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!targetUser || targetUser.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!targetUser.telegramChatId) {
    return NextResponse.json({ error: "User has no Telegram chat ID linked" }, { status: 400 });
  }

  const config = await getTelegramConfig(user.tenantId!);
  if (!config) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 400 });
  }

  const message = testTelegramMessage(config.botUsername || undefined);
  const result = await sendTelegramMessage({
    chatId: targetUser.telegramChatId,
    toName: targetUser.name,
    message,
    type: EmailType.TEST,
    tenantId: user.tenantId!,
  });

  return NextResponse.json(result);
}
