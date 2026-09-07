import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, CycleStatus } from "@prisma/client";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: ctx.params.id },
    include: {
      reviews: { include: { employee: true, reviewer: true } },
      goals: { include: { employee: true } },
      _count: true,
    },
  });
  if (!cycle || cycle.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ cycle });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER);
  const body = await req.json();
  const cycle = await prisma.performanceCycle.findUnique({ where: { id: ctx.params.id } });
  if (!cycle || cycle.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.status) data.status = body.status as CycleStatus;
  if (body.type) data.type = body.type;
  if (body.periodStart) data.periodStart = new Date(body.periodStart);
  if (body.periodEnd) data.periodEnd = new Date(body.periodEnd);
  if (body.selfReviewStart !== undefined) data.selfReviewStart = body.selfReviewStart ? new Date(body.selfReviewStart) : null;
  if (body.selfReviewEnd !== undefined) data.selfReviewEnd = body.selfReviewEnd ? new Date(body.selfReviewEnd) : null;
  if (body.managerReviewStart !== undefined) data.managerReviewStart = body.managerReviewStart ? new Date(body.managerReviewStart) : null;
  if (body.managerReviewEnd !== undefined) data.managerReviewEnd = body.managerReviewEnd ? new Date(body.managerReviewEnd) : null;
  if (body.ratingScale) data.ratingScale = body.ratingScale;
  if (body.competencies !== undefined) data.competencies = body.competencies;

  const updated = await prisma.performanceCycle.update({ where: { id: ctx.params.id }, data });
  return NextResponse.json({ cycle: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN);
  const cycle = await prisma.performanceCycle.findUnique({ where: { id: ctx.params.id } });
  if (!cycle || cycle.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.performanceCycle.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
