"use client";

import { useState } from "react";
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
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  phone: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "badge-brand",
  MANAGER: "badge-blue",
  STAFF: "badge-purple",
  EMPLOYEE: "badge-gray",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  EMPLOYEE: "Employee",
};

export function TenantUsersClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "STAFF",
    phone: "",
    password: "",
    isActive: true,
    sendActivation: true,
  });

  function set<K extends keyof typeof form>(k: K, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      role: "STAFF",
      phone: "",
      password: "",
      isActive: true,
      sendActivation: true,
    });
    setError({});
    setBanner(null);
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || "",
      password: "",
      isActive: u.isActive,
      sendActivation: false,
    });
    setError({});
    setBanner(null);
    setModalOpen(true);
  }

  async function submit() {
    setError({});
    setLoading(true);
    setBanner(null);

    try {
      if (editing) {
        const body: Record<string, unknown> = {
          action: "update",
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone || null,
          isActive: form.isActive,
        };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || { _: "Failed to update user" });
          setLoading(false);
          return;
        }
        setBanner({ type: "success", msg: "User updated successfully." });
      } else {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone || undefined,
          isActive: form.isActive,
          sendActivation: form.sendActivation,
        };
        if (form.password) body.password = form.password;

        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
      setError({ _: "An unexpected error occurred." });
      setLoading(false);
    }
  }

  async function patchAction(id: string, action: string, successMsg: string) {
    setOpenMenu(null);
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

  async function deleteUser(u: User) {
    setOpenMenu(null);
    setBanner(null);
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      setBanner({ type: "success", msg: "User deleted." });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setBanner({ type: "error", msg: data.error || "Failed to delete user." });
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  function initials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
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
          {banner.msg}
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-40"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <select
          className="input sm:w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> Create User
        </button>
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
                <th>Employee</th>
                <th>Status</th>
                <th>Last Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink-400">
                    <Users className="mx-auto mb-2 h-8 w-8 text-ink-300" />
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                        {initials(u.name) || "?"}
                      </div>
                      <span className="font-medium text-ink-900">{u.name}</span>
                    </div>
                  </td>
                  <td data-label="Email" className="text-ink-600">{u.email}</td>
                  <td data-label="Role">
                    <span className={ROLE_BADGE[u.role] || "badge-gray"}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td data-label="Employee">
                    {u.employee ? (
                      <span className="font-mono text-xs text-ink-600">
                        {u.employee.employeeCode}
                      </span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td data-label="Status">
                    {u.isActive ? (
                      <StatusBadge status="active" />
                    ) : (
                      <StatusBadge status="inactive" />
                    )}
                  </td>
                  <td data-label="Last Login" className="text-ink-500">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  </td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-pop">
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              openEdit(u);
                            }}
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
                            onClick={() =>
                              patchAction(u.id, "send_activation", "Activation email sent.")
                            }
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            <Mail className="h-4 w-4" /> Send Activation Email
                          </button>
                          <button
                            onClick={() =>
                              patchAction(u.id, "send_reset", "Password reset email sent.")
                            }
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            <KeyRound className="h-4 w-4" /> Send Password Reset
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
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
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Role">
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </Field>
                <Field label="Phone">
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="Password"
                error={error.password}
                hint={editing ? "Leave blank to keep current" : "Leave blank to send activation email"}
              >
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
              </Field>

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

              {error._ && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error._}
                </div>
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
        {label}{" "}
        {hint && <span className="text-xs font-normal text-ink-400">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
