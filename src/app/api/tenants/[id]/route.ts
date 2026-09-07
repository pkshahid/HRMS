import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  await requireRole(UserRole.SUPER_ADMIN);
  const body = await req.json();
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.status) data.status = body.status;
  if (body.plan) data.plan = body.plan;
  if (body.currency) data.currency = body.currency;
  if (body.country !== undefined) data.country = body.country;

  const tenant = await prisma.tenant.update({ where: { id: ctx.params.id }, data });
  return NextResponse.json({ tenant });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  await requireRole(UserRole.SUPER_ADMIN);
  await prisma.tenant.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
