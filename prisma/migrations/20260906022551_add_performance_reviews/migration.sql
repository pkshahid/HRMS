-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'OPEN', 'REVIEW_IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "CycleType" AS ENUM ('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'PROBATION', 'PROJECT_BASED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NOT_STARTED', 'SELF_REVIEW_PENDING', 'SELF_REVIEW_DONE', 'MANAGER_REVIEW_PENDING', 'MANAGER_REVIEW_DONE', 'CALIBRATION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewerType" AS ENUM ('SELF', 'MANAGER', 'PEER', 'HR', 'SKIP_LEVEL');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ON_TRACK', 'AT_RISK', 'ACHIEVED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('PERFORMANCE', 'DEVELOPMENT', 'BEHAVIORAL', 'OKR', 'KPI');

-- CreateTable
CREATE TABLE "PerformanceCycle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CycleType" NOT NULL DEFAULT 'ANNUAL',
    "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "selfReviewStart" TIMESTAMP(3),
    "selfReviewEnd" TIMESTAMP(3),
    "managerReviewStart" TIMESTAMP(3),
    "managerReviewEnd" TIMESTAMP(3),
    "ratingScale" TEXT NOT NULL DEFAULT '5',
    "competencies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "selfRating" INTEGER,
    "selfStrengths" TEXT,
    "selfImprovements" TEXT,
    "selfAchievements" TEXT,
    "selfComments" TEXT,
    "selfSubmittedAt" TIMESTAMP(3),
    "managerRating" INTEGER,
    "managerStrengths" TEXT,
    "managerImprovements" TEXT,
    "managerAchievements" TEXT,
    "managerComments" TEXT,
    "managerSubmittedAt" TIMESTAMP(3),
    "competencyScores" JSONB,
    "finalRating" INTEGER,
    "finalComments" TEXT,
    "recommendations" TEXT,
    "calibrationNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFeedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reviewId" TEXT,
    "cycleId" TEXT,
    "fromEmployeeId" TEXT NOT NULL,
    "toEmployeeId" TEXT NOT NULL,
    "type" "ReviewerType" NOT NULL DEFAULT 'PEER',
    "rating" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "comments" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceGoal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL DEFAULT 'PERFORMANCE',
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "targetValue" TEXT,
    "actualValue" TEXT,
    "unit" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceCycle_tenantId_idx" ON "PerformanceCycle"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceCycle_tenantId_name_key" ON "PerformanceCycle"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PerformanceReview_tenantId_idx" ON "PerformanceReview"("tenantId");

-- CreateIndex
CREATE INDEX "PerformanceReview_employeeId_idx" ON "PerformanceReview"("employeeId");

-- CreateIndex
CREATE INDEX "PerformanceReview_reviewerId_idx" ON "PerformanceReview"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReview_cycleId_employeeId_key" ON "PerformanceReview"("cycleId", "employeeId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_tenantId_idx" ON "ReviewFeedback"("tenantId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_toEmployeeId_idx" ON "ReviewFeedback"("toEmployeeId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_fromEmployeeId_idx" ON "ReviewFeedback"("fromEmployeeId");

-- CreateIndex
CREATE INDEX "PerformanceGoal_tenantId_idx" ON "PerformanceGoal"("tenantId");

-- CreateIndex
CREATE INDEX "PerformanceGoal_employeeId_idx" ON "PerformanceGoal"("employeeId");

-- CreateIndex
CREATE INDEX "PerformanceGoal_cycleId_idx" ON "PerformanceGoal"("cycleId");

-- AddForeignKey
ALTER TABLE "PerformanceCycle" ADD CONSTRAINT "PerformanceCycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "PerformanceReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_fromEmployeeId_fkey" FOREIGN KEY ("fromEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_toEmployeeId_fkey" FOREIGN KEY ("toEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceGoal" ADD CONSTRAINT "PerformanceGoal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceGoal" ADD CONSTRAINT "PerformanceGoal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceGoal" ADD CONSTRAINT "PerformanceGoal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
