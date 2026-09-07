import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UserRole, LeaveStatus, LeaveType } from "@prisma/client";
import { z } from "zod";

const applySchema = z.object({
  type: z.enum(["ANNUAL", "SICK", "CASUAL", "MATERNITY", "PATERNITY", "UNPAID", "EMERGENCY"]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
  employeeId: z.string().optional(), // for managers/staff applying on behalf
});

function daysBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mine = searchParams.get("mine") === "true";

  const where: any = { tenantId: user.tenantId };
  if (mine && user.employeeId) where.employeeId = user.employeeId;
  if (status) where.status = status;

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: { employee: true },
    orderBy: { appliedAt: "desc" },
  });

  return NextResponse.json({ leaves });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user.tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  // determine employee
  let employeeId = user.employeeId;
  if (d.employeeId && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER || user.role === UserRole.STAFF)) {
    employeeId = d.employeeId;
  }
  if (!employeeId) return NextResponse.json({ error: "No employee profile linked" }, { status: 400 });

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp || emp.tenantId !== user.tenantId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const totalDays = daysBetween(d.startDate, d.endDate);

  const leave = await prisma.leaveRequest.create({
    data: {
      tenantId: user.tenantId,
      employeeId,
      type: d.type as LeaveType,
      status: LeaveStatus.PENDING,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      totalDays,
      reason: d.reason || null,
    },
  });

  return NextResponse.json({ leave }, { status: 201 });
}
