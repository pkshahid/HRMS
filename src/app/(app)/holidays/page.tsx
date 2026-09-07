import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { HolidaysClient } from "@/components/attendance/holidays-client";

export default async function HolidaysPage() {
  const user = await requireAuth();
  const canManage = user.role === UserRole.ADMIN;

  const holidays = await prisma.holiday.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: { date: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Holidays"
        description={`${holidays.length} holiday${holidays.length === 1 ? "" : "s"} scheduled`}
        actions={canManage && <HolidaysClient tenantId={user.tenantId!} />}
      />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Holiday</th><th>Date</th><th>Day</th><th>Type</th></tr></thead>
            <tbody>
              {holidays.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-ink-500">No holidays scheduled.</td></tr>
              )}
              {holidays.map((h) => (
                <tr key={h.id}>
                  <td data-label="Holiday" className="font-medium text-ink-900">{h.name}</td>
                  <td data-label="Date">{formatDate(h.date)}</td>
                  <td data-label="Day">{new Date(h.date).toLocaleDateString("en-GB", { weekday: "long" })}</td>
                  <td data-label="Type"><span className="badge-gray capitalize">{h.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
