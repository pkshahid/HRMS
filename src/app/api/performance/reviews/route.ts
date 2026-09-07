import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { UserRole, ReviewStatus } from "@prisma/client";
import { z } from "zod";

const selfSchema = z.object({
  reviewId: z.string(),
  selfRating: z.number().int().min(1).max(10),
  selfStrengths: z.string().optional(),
  selfImprovements: z.string().optional(),
  selfAchievements: z.string().optional(),
  selfComments: z.string().optional(),
});

const managerSchema = z.object({
  reviewId: z.string(),
  managerRating: z.number().int().min(1).max(10),
  managerStrengths: z.string().optional(),
  managerImprovements: z.string().optional(),
  managerAchievements: z.string().optional(),
  managerComments: z.string().optional(),
  competencyScores: z.any().optional(),
  finalRating: z.number().int().min(1).max(10).optional(),
  finalComments: z.string().optional(),
  recommendations: z.string().optional(),
  calibrationNote: z.string().optional(),
  complete: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get("cycleId");
  const mine = searchParams.get("mine") === "true";
  const toReview = searchParams.get("toReview") === "true";

  const where: any = { tenantId: user.tenantId };
  if (cycleId) where.cycleId = cycleId;
  if (mine && user.employeeId) where.employeeId = user.employeeId;
  if (toReview && user.employeeId) where.reviewerId = user.employeeId;

  const reviews = await prisma.performanceReview.findMany({
    where,
    include: { employee: true, reviewer: true, cycle: true, feedback: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

// Submit self-assessment
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const body = await req.json();
  const parsed = selfSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const review = await prisma.performanceReview.findUnique({
    where: { id: d.reviewId },
    include: { cycle: true },
  });
  if (!review || review.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // employees can only submit their own self-assessment
  if (review.employeeId !== user.employeeId && user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "You can only submit your own self-assessment" }, { status: 403 });
  }

  const newStatus = review.status === ReviewStatus.NOT_STARTED || review.status === ReviewStatus.SELF_REVIEW_PENDING
    ? ReviewStatus.SELF_REVIEW_DONE
    : review.status;

  const updated = await prisma.performanceReview.update({
    where: { id: d.reviewId },
    data: {
      selfRating: d.selfRating,
      selfStrengths: d.selfStrengths || null,
      selfImprovements: d.selfImprovements || null,
      selfAchievements: d.selfAchievements || null,
      selfComments: d.selfComments || null,
      selfSubmittedAt: new Date(),
      status: newStatus,
    },
  });

  return NextResponse.json({ review: updated });
}

// Submit manager assessment (PATCH)
export async function PATCH(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const body = await req.json();
  const parsed = managerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const review = await prisma.performanceReview.findUnique({
    where: { id: d.reviewId },
    include: { cycle: true },
  });
  if (!review || review.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // managers can only review their direct reports (admin/staff can review any)
  if (user.role === UserRole.MANAGER && review.reviewerId !== user.employeeId) {
    return NextResponse.json({ error: "You can only review your direct reports" }, { status: 403 });
  }

  const newStatus = d.complete ? ReviewStatus.COMPLETED : ReviewStatus.MANAGER_REVIEW_DONE;

  const updated = await prisma.performanceReview.update({
    where: { id: d.reviewId },
    data: {
      managerRating: d.managerRating,
      managerStrengths: d.managerStrengths || null,
      managerImprovements: d.managerImprovements || null,
      managerAchievements: d.managerAchievements || null,
      managerComments: d.managerComments || null,
      managerSubmittedAt: new Date(),
      competencyScores: d.competencyScores || undefined,
      finalRating: d.finalRating || undefined,
      finalComments: d.finalComments || null,
      recommendations: d.recommendations || null,
      calibrationNote: d.calibrationNote || null,
      completedAt: d.complete ? new Date() : null,
      status: newStatus,
    },
  });

  return NextResponse.json({ review: updated });
}
