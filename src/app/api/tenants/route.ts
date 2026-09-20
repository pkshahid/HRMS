import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizeCurrency } from "@/lib/currency";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  country: z.string().optional(),
  currency: z.string().default("AED"),
  timezone: z.string().default("Asia/Dubai"),
  plan: z.string().default("standard"),
  // initial admin account
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  adminName: z.string().min(1),
});

export async function GET() {
  await requireRole(UserRole.SUPER_ADMIN);
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { employees: true, users: true } } },
  });
  return NextResponse.json({ tenants });
}

export async function POST(req: NextRequest) {
  await requireRole(UserRole.SUPER_ADMIN);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;

  const existingSlug = await prisma.tenant.findUnique({ where: { slug: d.slug } });
  if (existingSlug) return NextResponse.json({ error: { slug: ["Slug already in use"] } }, { status: 400 });
  const existingUser = await prisma.user.findUnique({ where: { email: d.adminEmail } });
  if (existingUser) return NextResponse.json({ error: { adminEmail: ["Email already registered"] } }, { status: 400 });

  const tenant = await prisma.tenant.create({
    data: {
      name: d.name,
      slug: d.slug,
      country: d.country || null,
      currency: normalizeCurrency(d.currency),
      timezone: d.timezone,
      plan: d.plan,
    },
  });

  const hash = await bcrypt.hash(d.adminPassword, 10);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: d.adminEmail,
      passwordHash: hash,
      name: d.adminName,
      role: UserRole.ADMIN,
    },
  });

  return NextResponse.json({ tenant }, { status: 201 });
}
