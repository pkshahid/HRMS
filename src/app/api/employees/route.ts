import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  employeeCode: z.string().min(1),
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
  joinDate: z.string(),
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
  // optional: create a login account for this employee
  createAccount: z.boolean().optional(),
  accountRole: z.enum(["EMPLOYEE", "MANAGER", "STAFF", "ADMIN"]).optional(),
  accountPassword: z.string().optional(),
});

function toDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF);
  if (!user.tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const departmentId = searchParams.get("departmentId");

  const employees = await prisma.employee.findMany({
    where: {
      tenantId: user.tenantId,
      ...(q ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { employeeCode: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
      ...(departmentId && departmentId !== "all" ? { departmentId } : {}),
    },
    include: { department: true, reportingTo: true, salaryStructure: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  if (!user.tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;

  // uniqueness checks
  const existsCode = await prisma.employee.findUnique({ where: { tenantId_employeeCode: { tenantId: user.tenantId, employeeCode: d.employeeCode } } });
  if (existsCode) return NextResponse.json({ error: { employeeCode: ["Employee code already exists"] } }, { status: 400 });
  const existsEmail = await prisma.employee.findUnique({ where: { tenantId_email: { tenantId: user.tenantId, email: d.email } } });
  if (existsEmail) return NextResponse.json({ error: { email: ["Email already exists"] } }, { status: 400 });

  const emp = await prisma.employee.create({
    data: {
      tenantId: user.tenantId,
      employeeCode: d.employeeCode,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone || null,
      gender: d.gender || null,
      dateOfBirth: toDate(d.dateOfBirth),
      maritalStatus: d.maritalStatus || null,
      nationality: d.nationality || null,
      religion: d.religion || null,
      departmentId: d.departmentId || null,
      designation: d.designation || null,
      employmentType: d.employmentType || "FULL_TIME",
      status: d.status || "ACTIVE",
      joinDate: new Date(d.joinDate),
      exitDate: toDate(d.exitDate),
      reportingToId: d.reportingToId || null,
      addressLine1: d.addressLine1 || null,
      addressLine2: d.addressLine2 || null,
      city: d.city || null,
      state: d.state || null,
      country: d.country || null,
      postalCode: d.postalCode || null,
      passportNumber: d.passportNumber || null,
      passportExpiry: toDate(d.passportExpiry),
      visaNumber: d.visaNumber || null,
      visaType: d.visaType || null,
      visaExpiry: toDate(d.visaExpiry),
      emiratesIdNumber: d.emiratesIdNumber || null,
      emiratesIdExpiry: toDate(d.emiratesIdExpiry),
      iqamaNumber: d.iqamaNumber || null,
      iqamaExpiry: toDate(d.iqamaExpiry),
      nationalIdNumber: d.nationalIdNumber || null,
      workPermitNumber: d.workPermitNumber || null,
      workPermitExpiry: toDate(d.workPermitExpiry),
      bankName: d.bankName || null,
      bankAccountNumber: d.bankAccountNumber || null,
      bankIban: d.bankIban || null,
      bankSwift: d.bankSwift || null,
    },
  });

  // optionally create a login account linked to this employee
  if (d.createAccount && d.accountPassword) {
    const existingUser = await prisma.user.findUnique({ where: { email: d.email } });
    if (!existingUser) {
      const hash = await bcrypt.hash(d.accountPassword, 10);
      const u = await prisma.user.create({
        data: {
          tenantId: user.tenantId,
          email: d.email,
          passwordHash: hash,
          name: `${d.firstName} ${d.lastName}`,
          role: d.accountRole || "EMPLOYEE",
        },
      });
      await prisma.employee.update({ where: { id: emp.id }, data: { userId: u.id } });
    }
  }

  return NextResponse.json({ employee: emp }, { status: 201 });
}
