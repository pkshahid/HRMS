import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { MyNotificationsClient } from "@/components/settings/my-notifications-client";

export default async function MyNotificationsPage() {
  const user = await requireAuth();

  const [fullUser, telegramConfig] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        telegramChatId: true,
        telegramUsername: true,
        telegramNotify: true,
      },
    }),
    prisma.telegramConfig.findUnique({
      where: { tenantId: user.tenantId! },
      select: {
        botUsername: true,
        enabled: true,
        welcomeMessage: true,
      },
    }),
  ]);

  if (!fullUser) return <div className="card p-6">User not found.</div>;

  return (
    <>
      <PageHeader
        title="My Notifications"
        description="Manage your Telegram notification preferences."
      />
      <MyNotificationsClient
        user={JSON.parse(JSON.stringify(fullUser))}
        telegramConfig={telegramConfig ? JSON.parse(JSON.stringify(telegramConfig)) : null}
      />
    </>
  );
}
