"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { initials } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Users, ChevronRight } from "lucide-react";

type Row = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  designation?: string | null;
  departmentName: string;
  status: string;
  joinDate: string;
  nationality?: string | null;
};

export function EmployeesListClient({
  employees,
  departments,
  initialQuery,
  initialDept,
}: {
  employees: Row[];
  departments: { id: string; name: string }[];
  initialQuery: string;
  initialDept: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [dept, setDept] = useState(initialDept);
  const [, startTransition] = useTransition();

  function update(nextQ: string, nextDept: string) {
    const sp = new URLSearchParams(params.toString());
    if (nextQ) sp.set("q", nextQ); else sp.delete("q");
    if (nextDept && nextDept !== "all") sp.set("departmentId", nextDept); else sp.delete("departmentId");
    startTransition(() => router.replace(`/employees?${sp.toString()}`));
  }

  return (
    <>
      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              update(e.target.value, dept);
            }}
            placeholder="Search by name, code or email..."
            className="input pl-9"
          />
        </div>
        <select
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            update(q, e.target.value);
          }}
          className="input sm:w-56"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {employees.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-ink-900">No employees found</h3>
            <p className="mt-1 text-sm text-ink-500">Try adjusting your search or add a new employee.</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Nationality</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td data-label="Employee">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                          {initials(`${e.firstName} ${e.lastName}`)}
                        </div>
                        <div>
                          <div className="font-medium text-ink-900">{e.firstName} {e.lastName}</div>
                          <div className="text-xs text-ink-500">{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Code" className="font-mono text-xs">{e.employeeCode}</td>
                    <td data-label="Department">{e.departmentName}</td>
                    <td data-label="Designation">{e.designation || "—"}</td>
                    <td data-label="Nationality">{e.nationality || "—"}</td>
                    <td data-label="Joined">{e.joinDate}</td>
                    <td data-label="Status"><StatusBadge status={e.status} /></td>
                    <td>
                      <Link
                        href={`/employees/${e.id}`}
                        className="inline-flex items-center rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
