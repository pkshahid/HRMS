import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, CycleStatus, CycleType, ReviewStatus } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["ANNUAL", "SEMI_ANNUAL", "QUARTERLY", "MONTHLY", "PROBATION", "PROJECT_BASED"]).optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
  selfReviewStart: z.string().optional().nullable(),
  selfReviewEnd: z.string().optional().nullable(),
  managerReviewStart: z.string().optional().nullable(),
  managerReviewEnd: z.string().optional().nullable(),
  ratingScale: z.string().default("5"),
  competencies: z.any().optional(),
  // optionally auto-create review records for all active employees
  autoCreateReviews: z.boolean().optional(),
});

function toDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const cycles = await prisma.performanceCycle.findMany({
    where: { tenantId: user.tenantId! },
    include: { _count: { select: { reviews: true, goals: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ cycles });
}

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.performanceCycle.findUnique({ where: { tenantId_name: { tenantId: user.tenantId!, name: d.name } } });
  if (existing) return NextResponse.json({ error: { name: ["A cycle with this name already exists"] } }, { status: 400 });

  const cycle = await prisma.performanceCycle.create({
    data: {
      tenantId: user.tenantId!,
      name: d.name,
      type: (d.type as CycleType) || CycleType.ANNUAL,
      status: CycleStatus.DRAFT,
      periodStart: new Date(d.periodStart),
      periodEnd: new Date(d.periodEnd),
      selfReviewStart: toDate(d.selfReviewStart),
      selfReviewEnd: toDate(d.selfReviewEnd),
      managerReviewStart: toDate(d.managerReviewStart),
      managerReviewEnd: toDate(d.managerReviewEnd),
      ratingScale: d.ratingScale,
      competencies: d.competencies || null,
    },
  });

  // auto-create review records: one per active employee, reviewer = their reporting manager
  if (d.autoCreateReviews) {
    const employees = await prisma.employee.findMany({
      where: { tenantId: user.tenantId!, status: "ACTIVE", reportingToId: { not: null } },
    });
    for (const emp of employees) {
      await prisma.performanceReview.create({
        data: {
          tenantId: user.tenantId!,
          cycleId: cycle.id,
          employeeId: emp.id,
          reviewerId: emp.reportingToId!,
          status: ReviewStatus.SELF_REVIEW_PENDING,
        },
      }).catch(() => {}); // skip if duplicate
    }
  }

  return NextResponse.json({ cycle }, { status: 201 });
}
