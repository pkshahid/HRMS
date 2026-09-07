-- CreateEnum
CREATE TYPE "TelegramStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramNotify" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "telegramUsername" TEXT;

-- CreateTable
CREATE TABLE "TelegramConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "botUsername" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Welcome to WorkHub Notifications! Your account is now linked.',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyLeaveApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyExpenseApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyAdvanceApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyPayroll" BOOLEAN NOT NULL DEFAULT true,
    "notifyPasswordReset" BOOLEAN NOT NULL DEFAULT true,
    "notifyAccountActivation" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "EmailType" NOT NULL,
    "status" "TelegramStatus" NOT NULL DEFAULT 'PENDING',
    "chatId" TEXT NOT NULL,
    "toName" TEXT,
    "message" TEXT NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConfig_tenantId_key" ON "TelegramConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TelegramLog_tenantId_idx" ON "TelegramLog"("tenantId");

-- CreateIndex
CREATE INDEX "TelegramLog_status_idx" ON "TelegramLog"("status");

-- CreateIndex
CREATE INDEX "TelegramLog_type_idx" ON "TelegramLog"("type");

-- AddForeignKey
ALTER TABLE "TelegramConfig" ADD CONSTRAINT "TelegramConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramLog" ADD CONSTRAINT "TelegramLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
