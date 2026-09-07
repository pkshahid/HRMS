import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  date: z.string(),
  type: z.string().default("public"),
});

export async function POST(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN);
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const holiday = await prisma.holiday.create({
    data: {
      tenantId: user.tenantId!,
      name: d.name,
      date: new Date(d.date),
      type: d.type,
    },
  });
  return NextResponse.json({ holiday }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.holiday.deleteMany({ where: { id, tenantId: user.tenantId! } });
  return NextResponse.json({ ok: true });
}
