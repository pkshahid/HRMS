import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string | null;
      tenantSlug: string | null;
      tenantName: string | null;
      employeeId: string | null;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenantId: string | null;
    tenantSlug: string | null;
    tenantName: string | null;
    employeeId: string | null;
    avatarUrl: string | null;
  }
}
