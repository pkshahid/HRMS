import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, GoalStatus } from "@prisma/client";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const body = await req.json();

  const goal = await prisma.performanceGoal.findUnique({ where: { id: ctx.params.id } });
  if (!goal || goal.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  for (const k of ["title", "description", "type", "progress", "targetValue", "actualValue", "unit", "weight"]) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.status) {
    data.status = body.status as GoalStatus;
    if (body.status === "ACHIEVED") data.completedAt = new Date();
  }
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const updated = await prisma.performanceGoal.update({ where: { id: ctx.params.id }, data });
  return NextResponse.json({ goal: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER);
  const goal = await prisma.performanceGoal.findUnique({ where: { id: ctx.params.id } });
  if (!goal || goal.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.performanceGoal.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
