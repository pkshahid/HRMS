import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { testSmtpConnection, sendTestEmail } from "@/lib/email";

const updateSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional().nullable(),
  enabled: z.boolean(),
  notifyLeaveApproval: z.boolean().optional(),
  notifyExpenseApproval: z.boolean().optional(),
  notifyAdvanceApproval: z.boolean().optional(),
  notifyPayroll: z.boolean().optional(),
  notifyPasswordReset: z.boolean().optional(),
  notifyAccountActivation: z.boolean().optional(),
  // action: "test_connection" | "send_test" | "save"
  action: z.enum(["save", "test_connection", "send_test"]).optional(),
  testEmail: z.string().email().optional(),
});

export async function GET() {
  const user = await requireRole(UserRole.ADMIN);
  const config = await prisma.smtpConfig.findUnique({
    where: { tenantId: user.tenantId! },
  });

  if (!config) {
    return NextResponse.json({ config: null });
  }

  // Don't return the password in the API response
  return NextResponse.json({
    config: {
      ...config,
      password: config.password ? "••••••••" : "",
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
    const result = await testSmtpConnection({
      host: d.host,
      port: d.port,
      secure: d.secure,
      username: d.username,
      password: d.password,
      fromName: d.fromName,
      fromEmail: d.fromEmail,
      replyTo: d.replyTo,
      enabled: true,
    });

    // Update last test status if config exists
    if (user.tenantId) {
      const existing = await prisma.smtpConfig.findUnique({ where: { tenantId: user.tenantId } });
      if (existing) {
        await prisma.smtpConfig.update({
          where: { tenantId: user.tenantId },
          data: {
            lastTestAt: new Date(),
            lastTestStatus: result.success ? "success" : "error",
            lastTestError: result.error || null,
          },
        });
      }
    }

    return NextResponse.json(result);
  }

  // Handle send test email (saves config first, then sends)
  if (action === "send_test") {
    if (!d.testEmail) {
      return NextResponse.json({ error: "testEmail is required" }, { status: 400 });
    }

    // Save/update the config first
    const data = {
      host: d.host,
      port: d.port,
      secure: d.secure,
      username: d.username,
      password: d.password,
      fromName: d.fromName,
      fromEmail: d.fromEmail,
      replyTo: d.replyTo || null,
      enabled: true, // temporarily enable for test
    };

    await prisma.smtpConfig.upsert({
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

    const result = await sendTestEmail(user.tenantId!, d.testEmail);

    // Update test status
    await prisma.smtpConfig.update({
      where: { tenantId: user.tenantId! },
      data: {
        lastTestAt: new Date(),
        lastTestStatus: result.success ? "success" : "error",
        lastTestError: result.error || null,
        // restore the enabled flag from the form
        enabled: d.enabled,
      },
    });

    return NextResponse.json(result);
  }

  // Default: save the config
  const data = {
    host: d.host,
    port: d.port,
    secure: d.secure,
    username: d.username,
    password: d.password,
    fromName: d.fromName,
    fromEmail: d.fromEmail,
    replyTo: d.replyTo || null,
    enabled: d.enabled,
    notifyLeaveApproval: d.notifyLeaveApproval ?? true,
    notifyExpenseApproval: d.notifyExpenseApproval ?? true,
    notifyAdvanceApproval: d.notifyAdvanceApproval ?? true,
    notifyPayroll: d.notifyPayroll ?? true,
    notifyPasswordReset: d.notifyPasswordReset ?? true,
    notifyAccountActivation: d.notifyAccountActivation ?? true,
  };

  const config = await prisma.smtpConfig.upsert({
    where: { tenantId: user.tenantId! },
    create: {
      tenantId: user.tenantId!,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({
    config: { ...config, password: "••••••••" },
  });
}
