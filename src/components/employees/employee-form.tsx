"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page";

type Dept = { id: string; name: string };
type Emp = { id: string; firstName: string; lastName: string };

export function EmployeeForm({
  departments,
  employees,
  tenantCountry,
}: {
  departments: Dept[];
  employees: Emp[];
  tenantCountry?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", employeeCode: "", phone: "",
    gender: "", dateOfBirth: "", maritalStatus: "", nationality: "", religion: "",
    departmentId: "", designation: "", employmentType: "FULL_TIME", status: "ACTIVE",
    joinDate: new Date().toISOString().split("T")[0], exitDate: "", reportingToId: "",
    addressLine1: "", addressLine2: "", city: "", state: "", country: tenantCountry || "", postalCode: "",
    passportNumber: "", passportExpiry: "", visaNumber: "", visaType: "", visaExpiry: "",
    emiratesIdNumber: "", emiratesIdExpiry: "", iqamaNumber: "", iqamaExpiry: "",
    nationalIdNumber: "", workPermitNumber: "", workPermitExpiry: "",
    bankName: "", bankAccountNumber: "", bankIban: "", bankSwift: "",
    createAccount: false, accountRole: "EMPLOYEE", accountPassword: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError({});
    setLoading(true);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const { employee } = await res.json();
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || { _: "Failed to create employee" });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title="Add Employee"
        description="Create a new employee record with identity, immigration and bank details."
        actions={
          <>
            <Link href="/employees" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back</Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </>
        }
      />

      {error._ && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error._}</div>}

      <div className="space-y-6">
        <Section title="Personal Information">
          <Grid>
            <Field label="First name" required error={error.firstName}>
              <input className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </Field>
            <Field label="Last name" required error={error.lastName}>
              <input className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </Field>
            <Field label="Email" required error={error.email}>
              <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </Field>
            <Field label="Employee code" required error={error.employeeCode}>
              <input className="input" value={form.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} required />
            </Field>
            <Field label="Phone">
              <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Gender">
              <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </Field>
            <Field label="Marital status">
              <select className="input" value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="">Select</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </Field>
            <Field label="Nationality">
              <input className="input" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="e.g. Emirati" />
            </Field>
            <Field label="Religion">
              <input className="input" value={form.religion} onChange={(e) => set("religion", e.target.value)} />
            </Field>
          </Grid>
        </Section>

        <Section title="Employment">
          <Grid>
            <Field label="Department">
              <select className="input" value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Designation">
              <input className="input" value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Software Engineer" />
            </Field>
            <Field label="Employment type">
              <select className="input" value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </Field>
            <Field label="Join date" required>
              <input type="date" className="input" value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} required />
            </Field>
            <Field label="Exit date">
              <input type="date" className="input" value={form.exitDate} onChange={(e) => set("exitDate", e.target.value)} />
            </Field>
            <Field label="Reporting to">
              <select className="input" value={form.reportingToId} onChange={(e) => set("reportingToId", e.target.value)}>
                <option value="">None</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </Field>
          </Grid>
        </Section>

        <Section title="Address">
          <Grid>
            <Field label="Address line 1"><input className="input" value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} /></Field>
            <Field label="Address line 2"><input className="input" value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} /></Field>
            <Field label="City"><input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="State / Emirate"><input className="input" value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
            <Field label="Country"><input className="input" value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
            <Field label="Postal code"><input className="input" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} /></Field>
          </Grid>
        </Section>

        <Section title="Identity & Immigration Documents" subtitle="Passport, visa, Emirates ID, iqama and work permit details.">
          <Grid>
            <Field label="Passport number"><input className="input" value={form.passportNumber} onChange={(e) => set("passportNumber", e.target.value)} /></Field>
            <Field label="Passport expiry"><input type="date" className="input" value={form.passportExpiry} onChange={(e) => set("passportExpiry", e.target.value)} /></Field>
            <Field label="Visa number"><input className="input" value={form.visaNumber} onChange={(e) => set("visaNumber", e.target.value)} /></Field>
            <Field label="Visa type">
              <select className="input" value={form.visaType} onChange={(e) => set("visaType", e.target.value)}>
                <option value="">Select</option>
                <option value="employment">Employment</option>
                <option value="residence">Residence</option>
                <option value="visit">Visit</option>
                <option value="student">Student</option>
              </select>
            </Field>
            <Field label="Visa expiry"><input type="date" className="input" value={form.visaExpiry} onChange={(e) => set("visaExpiry", e.target.value)} /></Field>
            <Field label="Emirates ID number" hint="UAE residents"><input className="input" value={form.emiratesIdNumber} onChange={(e) => set("emiratesIdNumber", e.target.value)} placeholder="784-XXXX-XXXXXXX-X" /></Field>
            <Field label="Emirates ID expiry"><input type="date" className="input" value={form.emiratesIdExpiry} onChange={(e) => set("emiratesIdExpiry", e.target.value)} /></Field>
            <Field label="Iqama number" hint="Saudi Arabia residents"><input className="input" value={form.iqamaNumber} onChange={(e) => set("iqamaNumber", e.target.value)} /></Field>
            <Field label="Iqama expiry"><input type="date" className="input" value={form.iqamaExpiry} onChange={(e) => set("iqamaExpiry", e.target.value)} /></Field>
            <Field label="National ID number"><input className="input" value={form.nationalIdNumber} onChange={(e) => set("nationalIdNumber", e.target.value)} /></Field>
            <Field label="Work permit number"><input className="input" value={form.workPermitNumber} onChange={(e) => set("workPermitNumber", e.target.value)} /></Field>
            <Field label="Work permit expiry"><input type="date" className="input" value={form.workPermitExpiry} onChange={(e) => set("workPermitExpiry", e.target.value)} /></Field>
          </Grid>
        </Section>

        <Section title="Bank Details">
          <Grid>
            <Field label="Bank name"><input className="input" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} /></Field>
            <Field label="Account number"><input className="input" value={form.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value)} /></Field>
            <Field label="IBAN"><input className="input" value={form.bankIban} onChange={(e) => set("bankIban", e.target.value)} /></Field>
            <Field label="SWIFT code"><input className="input" value={form.bankSwift} onChange={(e) => set("bankSwift", e.target.value)} /></Field>
          </Grid>
        </Section>

        <Section title="Login Account" subtitle="Optionally create a login account so this employee can sign in.">
          <div className="flex items-center gap-3">
            <input id="createAccount" type="checkbox" checked={form.createAccount} onChange={(e) => set("createAccount", e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
            <label htmlFor="createAccount" className="text-sm text-ink-700">Create a login account for this employee</label>
          </div>
          {form.createAccount && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Account role">
                <select className="input" value={form.accountRole} onChange={(e) => set("accountRole", e.target.value as any)}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
              <Field label="Password">
                <input type="password" className="input" value={form.accountPassword} onChange={(e) => set("accountPassword", e.target.value)} placeholder="Set initial password" />
              </Field>
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-2">
          <Link href="/employees" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Employee
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="mb-4 mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-1 text-xs font-normal text-ink-400">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
