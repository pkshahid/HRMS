import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { UserRole, GoalType, GoalStatus } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  employeeId: z.string(),
  cycleId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["PERFORMANCE", "DEVELOPMENT", "BEHAVIORAL", "OKR", "KPI"]).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_TRACK", "AT_RISK", "ACHIEVED", "MISSED", "CANCELLED"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  targetValue: z.string().optional().nullable(),
  actualValue: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  weight: z.number().int().min(0).max(100).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

function toDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const cycleId = searchParams.get("cycleId");
  const mine = searchParams.get("mine") === "true";

  const where: any = { tenantId: user.tenantId };
  if (employeeId) where.employeeId = employeeId;
  if (cycleId) where.cycleId = cycleId;
  if (mine && user.employeeId) where.employeeId = user.employeeId;

  const goals = await prisma.performanceGoal.findMany({
    where,
    include: { employee: true, cycle: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const emp = await prisma.employee.findUnique({ where: { id: d.employeeId } });
  if (!emp || emp.tenantId !== user.tenantId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const goal = await prisma.performanceGoal.create({
    data: {
      tenantId: user.tenantId!,
      employeeId: d.employeeId,
      cycleId: d.cycleId || null,
      title: d.title,
      description: d.description || null,
      type: (d.type as GoalType) || GoalType.PERFORMANCE,
      status: (d.status as GoalStatus) || GoalStatus.NOT_STARTED,
      progress: d.progress ?? 0,
      targetValue: d.targetValue || null,
      actualValue: d.actualValue || null,
      unit: d.unit || null,
      weight: d.weight ?? 0,
      startDate: toDate(d.startDate),
      dueDate: toDate(d.dueDate),
      completedAt: d.status === "ACHIEVED" ? new Date() : null,
    },
  });

  return NextResponse.json({ goal }, { status: 201 });
}
