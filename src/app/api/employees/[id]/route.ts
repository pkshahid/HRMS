import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"]).optional(),
  joinDate: z.string().optional(),
  exitDate: z.string().optional().nullable(),
  reportingToId: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  visaNumber: z.string().optional().nullable(),
  visaType: z.string().optional().nullable(),
  visaExpiry: z.string().optional().nullable(),
  emiratesIdNumber: z.string().optional().nullable(),
  emiratesIdExpiry: z.string().optional().nullable(),
  iqamaNumber: z.string().optional().nullable(),
  iqamaExpiry: z.string().optional().nullable(),
  nationalIdNumber: z.string().optional().nullable(),
  workPermitNumber: z.string().optional().nullable(),
  workPermitExpiry: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankIban: z.string().optional().nullable(),
  bankSwift: z.string().optional().nullable(),
});

function toDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.EMPLOYEE);
  const emp = await prisma.employee.findUnique({
    where: { id: ctx.params.id },
    include: {
      department: true,
      reportingTo: true,
      documents: true,
      salaryStructure: { include: { components: true } },
      attendances: { orderBy: { date: "desc" }, take: 10 },
      leaves: { orderBy: { appliedAt: "desc" }, take: 10 },
      user: true,
    },
  });
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // employees can only view their own profile
  if (user.role === UserRole.EMPLOYEE && emp.id !== user.employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (emp.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ employee: emp });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.employee.findUnique({ where: { id: ctx.params.id } });
  if (!existing || existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: any = {};
  for (const [k, v] of Object.entries(d)) {
    if (["dateOfBirth", "passportExpiry", "visaExpiry", "emiratesIdExpiry", "iqamaExpiry", "workPermitExpiry", "exitDate"].includes(k)) {
      data[k] = toDate(v as string | null);
    } else if (k === "joinDate") {
      data[k] = v ? new Date(v as string) : undefined;
    } else {
      data[k] = v;
    }
  }

  const emp = await prisma.employee.update({ where: { id: ctx.params.id }, data });
  return NextResponse.json({ employee: emp });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.ADMIN);
  const existing = await prisma.employee.findUnique({ where: { id: ctx.params.id } });
  if (!existing || existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.employee.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
