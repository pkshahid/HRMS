import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { normalizeCurrency } from "@/lib/currency";

const upsertSchema = z.object({
  employeeId: z.string(),
  currency: z.string().optional(),
  basicSalary: z.union([z.number(), z.string()]),
  housingAllowance: z.union([z.number(), z.string()]).optional(),
  transportAllowance: z.union([z.number(), z.string()]).optional(),
  foodAllowance: z.union([z.number(), z.string()]).optional(),
  otherAllowance: z.union([z.number(), z.string()]).optional(),
  overtimeRate: z.union([z.number(), z.string()]).optional(),
  taxRate: z.union([z.number(), z.string()]).optional(),
  insuranceRate: z.union([z.number(), z.string()]).optional(),
});

export async function GET() {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER);
  const structures = await prisma.salaryStructure.findMany({
    where: { tenantId: user.tenantId! },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ structures });
}

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const emp = await prisma.employee.findUnique({ where: { id: d.employeeId } });
  if (!emp || emp.tenantId !== user.tenantId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // Resolve currency: explicit value → tenant default → AED
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! }, select: { currency: true } });
  const currency = normalizeCurrency(d.currency, tenant?.currency || "AED");

  const data = {
    currency,
    basicSalary: Number(d.basicSalary),
    housingAllowance: Number(d.housingAllowance || 0),
    transportAllowance: Number(d.transportAllowance || 0),
    foodAllowance: Number(d.foodAllowance || 0),
    otherAllowance: Number(d.otherAllowance || 0),
    overtimeRate: Number(d.overtimeRate || 0),
    taxRate: Number(d.taxRate || 0),
    insuranceRate: Number(d.insuranceRate || 0),
  };

  const existing = await prisma.salaryStructure.findUnique({ where: { employeeId: d.employeeId } });
  let structure;
  if (existing) {
    structure = await prisma.salaryStructure.update({ where: { employeeId: d.employeeId }, data });
  } else {
    structure = await prisma.salaryStructure.create({
      data: { tenantId: user.tenantId!, employeeId: d.employeeId, ...data },
    });
  }

  return NextResponse.json({ structure });
}
