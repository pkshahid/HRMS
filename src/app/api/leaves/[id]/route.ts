import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, LeaveStatus } from "@prisma/client";
import { z } from "zod";
import { notifyLeaveApproved, notifyLeaveRejected } from "@/lib/notifications";
import { notifyLeaveApprovedTelegram, notifyLeaveRejectedTelegram } from "@/lib/telegram-notifications";

const decideSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approverNote: z.string().optional(),
});

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const body = await req.json();
  const parsed = decideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const leave = await prisma.leaveRequest.findUnique({ where: { id: ctx.params.id } });
  if (!leave || leave.tenantId !== user.tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (leave.status !== LeaveStatus.PENDING) return NextResponse.json({ error: "Already decided" }, { status: 400 });

  const updated = await prisma.leaveRequest.update({
    where: { id: ctx.params.id },
    data: {
      status: parsed.data.status as LeaveStatus,
      approverId: user.id,
      approverNote: parsed.data.approverNote || null,
      decidedAt: new Date(),
    },
  });

  // update leave balance if approved
  if (parsed.data.status === "APPROVED") {
    const year = new Date(leave.startDate).getFullYear();
    await prisma.leaveBalance.updateMany({
      where: { tenantId: user.tenantId!, employeeId: leave.employeeId, year, type: leave.type },
      data: { used: { increment: leave.totalDays } },
    });
  }

  // Send email notification (non-blocking)
  const approverName = user.name || "Manager";
  if (parsed.data.status === "APPROVED") {
    notifyLeaveApproved(user.tenantId!, leave.employeeId, approverName, {
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      approverNote: parsed.data.approverNote || null,
    }).catch(() => {});
    // Telegram notification
    const employee = await prisma.employee.findUnique({ where: { id: leave.employeeId }, select: { userId: true } });
    notifyLeaveApprovedTelegram(user.tenantId!, employee?.userId || null, leave.employeeId, approverName, {
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
    }).catch(() => {});
  } else {
    notifyLeaveRejected(user.tenantId!, leave.employeeId, approverName, {
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      rejectReason: parsed.data.approverNote || "No reason provided",
    }).catch(() => {});
    // Telegram notification
    const employee = await prisma.employee.findUnique({ where: { id: leave.employeeId }, select: { userId: true } });
    notifyLeaveRejectedTelegram(user.tenantId!, employee?.userId || null, leave.employeeId, approverName, {
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      rejectReason: parsed.data.approverNote || "No reason provided",
    }).catch(() => {});
  }

  return NextResponse.json({ leave: updated });
}
