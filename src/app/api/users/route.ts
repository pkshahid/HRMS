import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ---------------------------------------------------------------------------
// GET — List users
// SUPER_ADMIN: all users across all tenants
// ADMIN: users in their tenant only
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const user = await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const tenantId = searchParams.get("tenantId");
  const active = searchParams.get("active");

  const where: any = {};

  if (user.role === UserRole.SUPER_ADMIN) {
    // Super admin can see all users, optionally filter by tenant
    if (tenantId) where.tenantId = tenantId;
  } else {
    // Tenant admin can only see their own tenant's users
    where.tenantId = user.tenantId;
  }

  if (role) where.role = role;
  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  // Exclude super_admin users from tenant admin view
  if (user.role !== UserRole.SUPER_ADMIN) {
    where.role = { not: UserRole.SUPER_ADMIN };
    if (role && role !== "SUPER_ADMIN") where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      isActive: true,
      phone: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      telegramChatId: true,
      telegramNotify: true,
      lastLoginAt: true,
      createdAt: true,
      tenant: { select: { id: true, name: true, slug: true } },
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// ---------------------------------------------------------------------------
// POST — Create a new user
// SUPER_ADMIN: can create users in any tenant (including super_admin)
// ADMIN: can create users in their own tenant only (not super_admin)
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "EMPLOYEE"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  phone: z.string().optional(),
  tenantId: z.string().optional(),
  sendActivation: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;

  // Determine target tenant
  let targetTenantId: string | null;
  if (user.role === UserRole.SUPER_ADMIN) {
    targetTenantId = d.tenantId || null; // super_admin can be tenantless
  } else {
    targetTenantId = user.tenantId;
    // Tenant admin cannot create super_admin users
    if (d.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: { role: ["Cannot create super admin users"] } }, { status: 403 });
    }
    // Tenant admin cannot create users in other tenants
    if (d.tenantId && d.tenantId !== user.tenantId) {
      return NextResponse.json({ error: { tenantId: ["Cannot create users in other tenants"] } }, { status: 403 });
    }
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: { email: ["Email already registered"] } }, { status: 400 });
  }

  // If password is provided, hash it. Otherwise, create inactive user that needs activation.
  const hasPassword = d.password && d.password.length >= 8;
  const passwordHash = hasPassword ? await bcrypt.hash(d.password!, 10) : await bcrypt.hash(crypto.randomUUID(), 10);

  const newUser = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      role: d.role as UserRole,
      passwordHash,
      phone: d.phone || null,
      tenantId: targetTenantId,
      isActive: d.isActive && !!hasPassword, // inactive until password is set if no password provided
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      isActive: true,
    },
  });

  // Send activation email if requested and password was not set
  if (d.sendActivation && !hasPassword && targetTenantId) {
    try {
      const { sendActivationEmail } = await import("@/lib/user-activation");
      await sendActivationEmail(newUser.id, targetTenantId);
    } catch {
      // Non-blocking — activation email failure shouldn't fail user creation
    }
  }

  return NextResponse.json({ user: newUser }, { status: 201 });
}
