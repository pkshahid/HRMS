import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, AttendanceStatus } from "@prisma/client";
import { z } from "zod";

const markSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "REMOTE", "LEAVE", "HOLIDAY"]).optional(),
  notes: z.string().optional().nullable(),
  source: z.string().optional(),
});

function calcHours(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return null;
  const ci = new Date(checkIn).getTime();
  const co = new Date(checkOut).getTime();
  if (isNaN(ci) || isNaN(co) || co <= ci) return null;
  return Math.round(((co - ci) / 3600000) * 100) / 100;
}

function calcLate(checkIn?: string | null) {
  if (!checkIn) return 0;
  const ci = new Date(checkIn);
  const expected = new Date(ci);
  expected.setHours(9, 0, 0, 0);
  const lateMs = ci.getTime() - expected.getTime();
  return lateMs > 0 ? Math.floor(lateMs / 60000) : 0;
}

export async function GET(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");

  const where: any = { tenantId: user.tenantId };
  if (date) {
    const d = new Date(date);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lt: end };
  }
  if (employeeId) where.employeeId = employeeId;

  const records = await prisma.attendance.findMany({
    where,
    include: { employee: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  const body = await req.json();
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const emp = await prisma.employee.findUnique({ where: { id: d.employeeId } });
  if (!emp || emp.tenantId !== user.tenantId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const date = new Date(d.date);
  const checkIn = d.checkIn ? new Date(d.checkIn) : null;
  const checkOut = d.checkOut ? new Date(d.checkOut) : null;
  const workHours = calcHours(d.checkIn, d.checkOut);
  const lateMinutes = calcLate(d.checkIn);

  let status: AttendanceStatus = d.status as any;
  if (!status) {
    if (!checkIn) status = AttendanceStatus.ABSENT;
    else if (lateMinutes > 15) status = AttendanceStatus.LATE;
    else status = AttendanceStatus.PRESENT;
  }

  const record = await prisma.attendance.upsert({
    where: { tenantId_employeeId_date: { tenantId: user.tenantId!, employeeId: d.employeeId, date } },
    create: {
      tenantId: user.tenantId!,
      employeeId: d.employeeId,
      date,
      checkIn,
      checkOut,
      status,
      workHours,
      lateMinutes,
      notes: d.notes || null,
      source: d.source || "manual",
    },
    update: {
      checkIn, checkOut, status, workHours, lateMinutes, notes: d.notes || null,
    },
  });

  return NextResponse.json({ record });
}
