import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await requireRole(UserRole.ADMIN);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = { tenantId: user.tenantId };
  if (status) where.status = status;
  if (type) where.type = type;

  const logs = await prisma.telegramLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs });
}
