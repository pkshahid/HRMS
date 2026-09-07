import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UserRole, ReviewerType } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  toEmployeeId: z.string(),
  cycleId: z.string().optional().nullable(),
  reviewId: z.string().optional().nullable(),
  type: z.enum(["SELF", "MANAGER", "PEER", "HR", "SKIP_LEVEL"]).optional(),
  rating: z.number().int().min(1).max(10).optional(),
  strengths: z.string().optional().nullable(),
  improvements: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
  isAnonymous: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const toEmployeeId = searchParams.get("toEmployeeId");
  const cycleId = searchParams.get("cycleId");
  const mine = searchParams.get("mine") === "true";

  const where: any = { tenantId: user.tenantId };
  if (toEmployeeId) where.toEmployeeId = toEmployeeId;
  if (cycleId) where.cycleId = cycleId;
  if (mine && user.employeeId) where.toEmployeeId = user.employeeId;

  const feedback = await prisma.reviewFeedback.findMany({
    where,
    include: { fromEmployee: true, toEmployee: true, cycle: true },
    orderBy: { submittedAt: "desc" },
  });

  // hide giver identity if anonymous (unless viewer is admin)
  const isAdmin = user.role === UserRole.ADMIN;
  const sanitized = feedback.map((f) =>
    f.isAnonymous && !isAdmin ? { ...f, fromEmployee: null, fromEmployeeId: null } : f
  );

  return NextResponse.json({ feedback: sanitized });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user.employeeId) return NextResponse.json({ error: "No employee profile linked" }, { status: 400 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const toEmp = await prisma.employee.findUnique({ where: { id: d.toEmployeeId } });
  if (!toEmp || toEmp.tenantId !== user.tenantId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  if (d.toEmployeeId === user.employeeId) return NextResponse.json({ error: "Cannot give feedback to yourself" }, { status: 400 });

  const feedback = await prisma.reviewFeedback.create({
    data: {
      tenantId: user.tenantId!,
      fromEmployeeId: user.employeeId,
      toEmployeeId: d.toEmployeeId,
      cycleId: d.cycleId || null,
      reviewId: d.reviewId || null,
      type: (d.type as ReviewerType) || ReviewerType.PEER,
      rating: d.rating || null,
      strengths: d.strengths || null,
      improvements: d.improvements || null,
      comments: d.comments || null,
      isAnonymous: d.isAnonymous ?? false,
    },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}
