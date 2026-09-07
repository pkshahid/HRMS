import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { SettingsClient } from "@/components/settings/settings-client";
import { UserRole } from "@prisma/client";

export default async function SettingsPage() {
  const user = await requireRole(UserRole.ADMIN);
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! } });
  if (!tenant) return <div className="card p-6">Tenant not found.</div>;

  return (
    <>
      <PageHeader title="Settings" description="Manage your organization settings." />
      <SettingsClient tenant={JSON.parse(JSON.stringify(tenant))} />
    </>
  );
}
