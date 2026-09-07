import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import {
  SmtpSettingsForm,
  type SmtpConfigData,
  type EmailLogData,
} from "@/components/settings/smtp-settings-form";
import {
  TelegramSettingsForm,
  type TelegramConfigData,
  type TelegramLogData,
} from "@/components/settings/telegram-settings-form";
import {
  TelegramUsers,
  type TelegramUserData,
} from "@/components/settings/telegram-users";
import { UserRole } from "@prisma/client";

export default async function DeveloperSettingsPage() {
  const user = await requireRole(UserRole.ADMIN);

  const config = await prisma.smtpConfig.findUnique({
    where: { tenantId: user.tenantId! },
  });

  const emailLogs = await prisma.emailLog.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const telegramConfig = await prisma.telegramConfig.findUnique({
    where: { tenantId: user.tenantId! },
  });

  const telegramLogs = await prisma.telegramLog.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const telegramUsers = await prisma.user.findMany({
    where: { tenantId: user.tenantId!, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      telegramChatId: true,
      telegramUsername: true,
      telegramNotify: true,
      employee: { select: { firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: { name: "asc" },
  });

  const configData: SmtpConfigData | null = config
    ? {
        host: config.host,
        port: config.port,
        secure: config.secure,
        username: config.username,
        password: "",
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        replyTo: config.replyTo,
        enabled: config.enabled,
        notifyLeaveApproval: config.notifyLeaveApproval,
        notifyExpenseApproval: config.notifyExpenseApproval,
        notifyAdvanceApproval: config.notifyAdvanceApproval,
        notifyPayroll: config.notifyPayroll,
        notifyPasswordReset: config.notifyPasswordReset,
        notifyAccountActivation: config.notifyAccountActivation,
        lastTestAt: config.lastTestAt ? config.lastTestAt.toISOString() : null,
        lastTestStatus: config.lastTestStatus,
        lastTestError: config.lastTestError,
      }
    : null;

  const logData: EmailLogData[] = emailLogs.map((log) => ({
    id: log.id,
    type: log.type,
    status: log.status,
    toEmail: log.toEmail,
    toName: log.toName,
    subject: log.subject,
    errorMessage: log.errorMessage,
    sentAt: log.sentAt ? log.sentAt.toISOString() : null,
    createdAt: log.createdAt.toISOString(),
  }));

  const telegramConfigData: TelegramConfigData | null = telegramConfig
    ? {
        botToken: "",
        botUsername: telegramConfig.botUsername,
        welcomeMessage: telegramConfig.welcomeMessage,
        enabled: telegramConfig.enabled,
        notifyLeaveApproval: telegramConfig.notifyLeaveApproval,
        notifyExpenseApproval: telegramConfig.notifyExpenseApproval,
        notifyAdvanceApproval: telegramConfig.notifyAdvanceApproval,
        notifyPayroll: telegramConfig.notifyPayroll,
        notifyPasswordReset: telegramConfig.notifyPasswordReset,
        notifyAccountActivation: telegramConfig.notifyAccountActivation,
        lastTestAt: telegramConfig.lastTestAt
          ? telegramConfig.lastTestAt.toISOString()
          : null,
        lastTestStatus: telegramConfig.lastTestStatus,
        lastTestError: telegramConfig.lastTestError,
      }
    : null;

  const telegramLogData: TelegramLogData[] = telegramLogs.map((log) => ({
    id: log.id,
    type: log.type,
    status: log.status,
    chatId: log.chatId,
    toName: log.toName,
    message: log.message,
    errorMessage: log.errorMessage,
    sentAt: log.sentAt ? log.sentAt.toISOString() : null,
    createdAt: log.createdAt.toISOString(),
  }));

  const telegramUserData: TelegramUserData[] = telegramUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    telegramChatId: u.telegramChatId,
    telegramUsername: u.telegramUsername,
    telegramNotify: u.telegramNotify,
    employee: u.employee
      ? {
          firstName: u.employee.firstName,
          lastName: u.employee.lastName,
          employeeCode: u.employee.employeeCode,
        }
      : null,
  }));

  return (
    <>
      <PageHeader
        title="Developer Settings"
        description="Configure SMTP email, Telegram bot, and notification preferences"
      />
      <SmtpSettingsForm
        initialConfig={configData}
        emailLogs={logData}
        hasPassword={!!config?.password}
      />

      <div className="mt-10">
        <TelegramSettingsForm
          initialConfig={telegramConfigData}
          telegramLogs={telegramLogData}
          hasToken={!!telegramConfig?.botToken}
        />
      </div>

      <div className="mt-10">
        <TelegramUsers
          users={telegramUserData}
          botUsername={telegramConfig?.botUsername ?? null}
          enabled={telegramConfig?.enabled ?? false}
        />
      </div>
    </>
  );
}
