"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Plus,
  X,
  Edit2,
  Trash2,
  Pause,
  Play,
  Mail,
  KeyRound,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { formatDate, initials } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
  isActive: boolean;
  phone: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: { id: string; name: string; slug: string } | null;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
};

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "EMPLOYEE"] as const;

function roleBadgeClass(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "badge bg-red-50 text-red-700";
    case "ADMIN":
      return "badge bg-brand-50 text-brand-700";
    case "MANAGER":
      return "badge bg-blue-50 text-blue-700";
    case "STAFF":
      return "badge bg-purple-50 text-purple-700";
    case "EMPLOYEE":
    default:
      return "badge bg-ink-100 text-ink-600";
  }
}

function roleLabel(role: string): string {
  return role.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UsersManagementClient({
  users,
  isSuperAdmin,
}: {
  users: User[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE",
    tenantId: "",
    phone: "",
    password: "",
    isActive: true,
    sendActivation: true,
  });

  const tenants = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();
    for (const u of users) {
      if (u.tenant) map.set(u.tenant.id, u.tenant);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      if (tenantFilter !== "all") {
        if (tenantFilter === "global" && u.tenantId !== null) return false;
        if (tenantFilter !== "global" && u.tenantId !== tenantFilter) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter, tenantFilter]);

  function set<K extends keyof typeof form>(k: K, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      role: isSuperAdmin ? "ADMIN" : "EMPLOYEE",
      tenantId: tenants[0]?.id ?? "",
      phone: "",
      password: "",
      isActive: true,
      sendActivation: true,
    });
    setError({});
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      tenantId: u.tenantId ?? "",
      phone: u.phone ?? "",
      password: "",
      isActive: u.isActive,
      sendActivation: false,
    });
    setError({});
    setMenuOpenId(null);
    setModalOpen(true);
  }

  async function submit() {
    setError({});
    setLoading(true);
    setBanner(null);

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
      phone: form.phone || undefined,
      isActive: form.isActive,
    };
    if (isSuperAdmin) {
      payload.tenantId = form.tenantId || undefined;
    }
    if (form.password) payload.password = form.password;
    if (!editing) payload.sendActivation = form.sendActivation;

    try {
      if (editing) {
        const res = await fetch(`/api/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", ...payload }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || { _: "Failed to update user" });
          setLoading(false);
          return;
        }
        setBanner({ type: "success", msg: "User updated successfully." });
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || { _: "Failed to create user" });
          setLoading(false);
          return;
        }
        setBanner({ type: "success", msg: "User created successfully." });
      }
      setModalOpen(false);
      router.refresh();
    } catch {
      setError({ _: "Network error. Please try again." });
    }
    setLoading(false);
  }

  async function patchAction(id: string, action: string, successMsg: string) {
    setMenuOpenId(null);
    setBanner(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setBanner({ type: "success", msg: successMsg });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setBanner({ type: "error", msg: data.error || "Action failed." });
    }
  }

  async function removeUser(u: User) {
    setMenuOpenId(null);
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    setBanner(null);
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      setBanner({ type: "success", msg: "User deleted." });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setBanner({ type: "error", msg: data.error || "Failed to delete user." });
    }
  }

  function setMenuOpenId(id: string | null) {
    setOpenMenuId(id);
  }

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            banner.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span>{banner.msg}</span>
            <button onClick={() => setBanner(null)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header with Create button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Users className="h-4 w-4" />
          <span>{filtered.length} of {users.length} users</span>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> Create User
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {isSuperAdmin && (
            <select className="input" value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}>
              <option value="all">All Tenants</option>
              <option value="global">Global (Super Admins)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>Last Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-ink-400">
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {initials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink-900">{u.name}</div>
                        {u.employee && (
                          <div className="truncate text-xs text-ink-400">
                            {u.employee.firstName} {u.employee.lastName} · {u.employee.employeeCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="Email" className="text-ink-600">{u.email}</td>
                  <td data-label="Role">
                    <span className={roleBadgeClass(u.role)}>{roleLabel(u.role)}</span>
                  </td>
                  <td data-label="Tenant">
                    {u.tenant ? (
                      <span className="text-ink-700">{u.tenant.name}</span>
                    ) : (
                      <span className="text-ink-400 italic">Global</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={u.isActive ? "active" : "suspended"} />
                  </td>
                  <td data-label="Last Login" className="text-ink-500">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  </td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(openMenuId === u.id ? null : u.id)}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === u.id && (
                        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-pop">
                          <button
                            onClick={() => openEdit(u)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            <Edit2 className="h-4 w-4" /> Edit
                          </button>
                          {u.isActive ? (
                            <button
                              onClick={() => patchAction(u.id, "deactivate", "User deactivated.")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                            >
                              <Pause className="h-4 w-4" /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => patchAction(u.id, "activate", "User activated.")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                            >
                              <Play className="h-4 w-4" /> Activate
                            </button>
                          )}
                          <button
                            onClick={() => patchAction(u.id, "send_activation", "Activation email sent.")}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            <Mail className="h-4 w-4" /> Send Activation Email
                          </button>
                          <button
                            onClick={() => patchAction(u.id, "send_reset", "Password reset email sent.")}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            <KeyRound className="h-4 w-4" /> Send Password Reset
                          </button>
                          <button
                            onClick={() => removeUser(u)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-lg card max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">
                {editing ? "Edit User" : "Create New User"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" error={error.name}>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </Field>
                <Field label="Email" error={error.email}>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                  />
                </Field>
                <Field label="Role" error={error.role}>
                  <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
                    {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </Field>
                {isSuperAdmin && (
                  <Field label="Tenant" error={error.tenantId} hint="blank for global super admin">
                    <select
                      className="input"
                      value={form.tenantId}
                      onChange={(e) => set("tenantId", e.target.value)}
                    >
                      <option value="">— Global (no tenant) —</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Phone" error={error.phone}>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="optional"
                  />
                </Field>
                <Field
                  label="Password"
                  error={error.password}
                  hint={editing ? "leave blank to keep current" : "leave blank to send activation email"}
                >
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="••••••••"
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => set("isActive", e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300"
                  />
                  Active
                </label>
                {!editing && !form.password && (
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={form.sendActivation}
                      onChange={(e) => set("sendActivation", e.target.checked)}
                      className="h-4 w-4 rounded border-ink-300"
                    />
                    Send activation email
                  </label>
                )}
              </div>

              {error._ && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error._}</div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={submit} disabled={loading} className="btn-primary">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editing ? "Save Changes" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label} {hint && <span className="text-xs font-normal text-ink-400">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
