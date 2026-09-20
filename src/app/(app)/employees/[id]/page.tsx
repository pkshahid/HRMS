import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { initials, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Globe, FileText } from "lucide-react";
import { UserRole } from "@prisma/client";
import { EmployeeDetailTabs } from "@/components/employees/employee-detail-tabs";
import { normalizeCurrency } from "@/lib/currency";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.EMPLOYEE);

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      reportingTo: true,
      documents: { orderBy: { createdAt: "desc" } },
      salaryStructure: { include: { components: true } },
      attendances: { orderBy: { date: "desc" }, take: 20 },
      leaves: { orderBy: { appliedAt: "desc" }, take: 20 },
      expenses: { orderBy: { createdAt: "desc" }, take: 10 },
      advances: { orderBy: { createdAt: "desc" }, take: 10 },
      user: true,
    },
  });

  if (!employee || employee.tenantId !== user.tenantId) notFound();

  // employees can only view their own
  if (user.role === UserRole.EMPLOYEE && employee.id !== user.employeeId) notFound();

  const canEdit = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;
  const tenantCurrency = normalizeCurrency((await prisma.tenant.findUnique({ where: { id: user.tenantId! } }))?.currency);

  const fullName = `${employee.firstName} ${employee.lastName}`;

  // expiry warnings
  const now = new Date();
  const soon = new Date(); soon.setDate(now.getDate() + 60);
  const expiryWarnings: { label: string; date: Date }[] = [];
  if (employee.passportExpiry) expiryWarnings.push({ label: "Passport", date: employee.passportExpiry });
  if (employee.visaExpiry) expiryWarnings.push({ label: "Visa", date: employee.visaExpiry });
  if (employee.emiratesIdExpiry) expiryWarnings.push({ label: "Emirates ID", date: employee.emiratesIdExpiry });
  if (employee.iqamaExpiry) expiryWarnings.push({ label: "Iqama", date: employee.iqamaExpiry });
  if (employee.workPermitExpiry) expiryWarnings.push({ label: "Work Permit", date: employee.workPermitExpiry });

  return (
    <>
      <PageHeader
        title={fullName}
        description={`${employee.employeeCode} · ${employee.designation || "—"} · ${employee.department?.name || "Unassigned"}`}
        actions={
          <>
            <Link href="/employees" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back</Link>
            {canEdit && <Link href={`/employees/${employee.id}/edit`} className="btn-primary"><Pencil className="h-4 w-4" /> Edit</Link>}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* left: profile card */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
                {initials(fullName)}
              </div>
              <div className="mt-3 text-lg font-semibold text-ink-900">{fullName}</div>
              <div className="text-sm text-ink-500">{employee.designation || "—"}</div>
              <div className="mt-2"><StatusBadge status={employee.status} /></div>
            </div>
            <div className="mt-5 space-y-3 border-t border-ink-100 pt-4 text-sm">
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              <InfoRow icon={Phone} label="Phone" value={employee.phone || "—"} />
              <InfoRow icon={Globe} label="Nationality" value={employee.nationality || "—"} />
              <InfoRow icon={MapPin} label="Location" value={[employee.city, employee.country].filter(Boolean).join(", ") || "—"} />
              <InfoRow icon={FileText} label="Joined" value={formatDate(employee.joinDate)} />
            </div>
          </div>

          {expiryWarnings.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-900">Document Expiry</h3>
              <div className="mt-3 space-y-2">
                {expiryWarnings.map((w) => {
                  const expired = w.date < now;
                  const expiringSoon = w.date < soon && !expired;
                  return (
                    <div key={w.label} className="flex items-center justify-between text-sm">
                      <span className="text-ink-600">{w.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-ink-500">{formatDate(w.date)}</span>
                        {expired ? <span className="badge-red">Expired</span> : expiringSoon ? <span className="badge-amber">Expiring</span> : <span className="badge-green">Valid</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* right: tabs */}
        <div className="lg:col-span-2">
          <EmployeeDetailTabs
            employee={employee}
            attendances={employee.attendances}
            leaves={employee.leaves}
            salaryStructure={employee.salaryStructure}
            currency={tenantCurrency}
            canEdit={canEdit}
            expenses={employee.expenses}
            advances={employee.advances}
          />
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
      <div className="min-w-0">
        <div className="text-xs text-ink-400">{label}</div>
        <div className="truncate text-ink-800">{value}</div>
      </div>
    </div>
  );
}
