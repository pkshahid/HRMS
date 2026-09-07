import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendActivationEmail, sendPasswordResetByAdmin } from "@/lib/user-activation";

type Ctx = { params: { id: string } };

// ---------------------------------------------------------------------------
// GET — Retrieve a single user
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);

  const target = await prisma.user.findUnique({
    where: { id: ctx.params.id },
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
      telegramUsername: true,
      telegramNotify: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      tenant: { select: { id: true, name: true, slug: true } },
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true } },
    },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Tenant admin can only view users in their own tenant
  if (user.role !== UserRole.SUPER_ADMIN) {
    if (target.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ user: target });
}

// ---------------------------------------------------------------------------
// PATCH — Update a user
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "EMPLOYEE"]).optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  // Actions
  action: z.enum(["update", "activate", "deactivate", "send_activation", "send_reset"]).optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const action = d.action || "update";

  const target = await prisma.user.findUnique({ where: { id: ctx.params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Authorization checks
  if (user.role !== UserRole.SUPER_ADMIN) {
    if (target.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Forbidden — user is in a different tenant" }, { status: 403 });
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden — cannot modify super admin" }, { status: 403 });
    }
    if (d.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden — cannot assign super admin role" }, { status: 403 });
    }
  }

  // Prevent self-deactivation
  if (target.id === user.id && (action === "deactivate" || d.isActive === false)) {
    return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
  }

  // Handle special actions
  if (action === "send_activation") {
    if (!target.tenantId) return NextResponse.json({ error: "User has no tenant" }, { status: 400 });
    const result = await sendActivationEmail(target.id, target.tenantId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send activation" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "send_reset") {
    if (!target.tenantId) return NextResponse.json({ error: "User has no tenant" }, { status: 400 });
    const result = await sendPasswordResetByAdmin(target.id, target.tenantId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send reset" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "activate") {
    const updated = await prisma.user.update({
      where: { id: ctx.params.id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
    });
    return NextResponse.json({ user: updated });
  }

  if (action === "deactivate") {
    const updated = await prisma.user.update({
      where: { id: ctx.params.id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });
    return NextResponse.json({ user: updated });
  }

  // Default: update fields
  const data: any = {};
  if (d.name) data.name = d.name;
  if (d.email) {
    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
    if (existing && existing.id !== target.id) {
      return NextResponse.json({ error: { email: ["Email already in use"] } }, { status: 400 });
    }
    data.email = d.email.toLowerCase();
  }
  if (d.role) data.role = d.role as UserRole;
  if (d.phone !== undefined) data.phone = d.phone || null;
  if (d.isActive !== undefined) data.isActive = d.isActive;
  if (d.password) data.passwordHash = await bcrypt.hash(d.password, 10);

  const updated = await prisma.user.update({
    where: { id: ctx.params.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      isActive: true,
      phone: true,
      lastLoginAt: true,
      tenant: { select: { id: true, name: true, slug: true } },
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
    },
  });

  return NextResponse.json({ user: updated });
}

// ---------------------------------------------------------------------------
// DELETE — Delete a user
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);

  const target = await prisma.user.findUnique({ where: { id: ctx.params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Authorization
  if (user.role !== UserRole.SUPER_ADMIN) {
    if (target.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Prevent self-deletion
  if (target.id === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
