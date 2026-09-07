import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { GiveFeedbackForm } from "@/components/performance/give-feedback-form";

export default async function GiveFeedbackPage() {
  const user = await requireAuth();
  if (!user.employeeId) return <div className="card p-6 text-sm text-ink-500">No employee profile linked to your account.</div>;

  const [employees, cycles] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId: user.tenantId!, status: "ACTIVE", id: { not: user.employeeId! } },
      orderBy: { firstName: "asc" },
    }),
    prisma.performanceCycle.findMany({ where: { tenantId: user.tenantId! }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Give Feedback"
        description="Share constructive feedback about a colleague. You can submit anonymously if you prefer."
      />
      <div className="max-w-2xl">
        <div className="card p-6">
          <GiveFeedbackForm
            employees={employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, designation: e.designation }))}
            cycles={cycles.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      </div>
    </>
  );
}
