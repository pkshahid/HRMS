-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_PENDING', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'EXPENSE_PAID', 'ADVANCE_APPROVED', 'ADVANCE_REJECTED', 'ADVANCE_DISBURSED', 'ADVANCE_RECOVERY', 'PAYROLL_GENERATED', 'PAYROLL_PAID', 'PASSWORD_RESET', 'ACCOUNT_ACTIVATION', 'WELCOME', 'TEST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activationToken" TEXT,
ADD COLUMN     "activationTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SmtpConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT 'WorkHub',
    "fromEmail" TEXT NOT NULL,
    "replyTo" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyLeaveApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyExpenseApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyAdvanceApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyPayroll" BOOLEAN NOT NULL DEFAULT true,
    "notifyPasswordReset" BOOLEAN NOT NULL DEFAULT true,
    "notifyAccountActivation" BOOLEAN NOT NULL DEFAULT true,
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmtpConfig_tenantId_key" ON "SmtpConfig"("tenantId");

-- CreateIndex
CREATE INDEX "EmailLog_tenantId_idx" ON "EmailLog"("tenantId");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_type_idx" ON "EmailLog"("type");

-- AddForeignKey
ALTER TABLE "SmtpConfig" ADD CONSTRAINT "SmtpConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
