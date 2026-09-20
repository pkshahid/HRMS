import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { SettingsClient } from "@/components/settings/settings-client";
import { UserRole } from "@prisma/client";
import { normalizeCurrency } from "@/lib/currency";

export default async function SettingsPage() {
  const user = await requireRole(UserRole.ADMIN);
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId! } });
  if (!tenant) return <div className="card p-6">Tenant not found.</div>;

  const normalized = { ...tenant, currency: normalizeCurrency(tenant.currency) };
  return (
    <>
      <PageHeader title="Settings" description="Manage your organization settings." />
      <SettingsClient tenant={JSON.parse(JSON.stringify(normalized))} />
    </>
  );
}
