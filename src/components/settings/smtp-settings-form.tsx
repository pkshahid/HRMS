"use client";

import { useState } from "react";
import { Mail, Save, Plug, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export type SmtpConfigData = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  enabled: boolean;
  notifyLeaveApproval: boolean;
  notifyExpenseApproval: boolean;
  notifyAdvanceApproval: boolean;
  notifyPayroll: boolean;
  notifyPasswordReset: boolean;
  notifyAccountActivation: boolean;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
};

export type EmailLogData = {
  id: string;
  type: string;
  status: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
};

const NOTIFICATION_TYPES: { key: keyof SmtpConfigData; label: string }[] = [
  { key: "notifyLeaveApproval", label: "Leave Approval" },
  { key: "notifyExpenseApproval", label: "Expense Approval" },
  { key: "notifyAdvanceApproval", label: "Advance Approval" },
  { key: "notifyPayroll", label: "Payroll" },
  { key: "notifyPasswordReset", label: "Password Reset" },
  { key: "notifyAccountActivation", label: "Account Activation" },
];

const DEFAULT_CONFIG: SmtpConfigData = {
  host: "",
  port: 587,
  secure: false,
  username: "",
  password: "",
  fromName: "WorkHub",
  fromEmail: "",
  replyTo: null,
  enabled: false,
  notifyLeaveApproval: true,
  notifyExpenseApproval: true,
  notifyAdvanceApproval: true,
  notifyPayroll: true,
  notifyPasswordReset: true,
  notifyAccountActivation: true,
  lastTestAt: null,
  lastTestStatus: null,
  lastTestError: null,
};

type Message = { type: "success" | "error"; text: string } | null;

export function SmtpSettingsForm({
  initialConfig,
  emailLogs,
  hasPassword,
}: {
  initialConfig: SmtpConfigData | null;
  emailLogs: EmailLogData[];
  hasPassword: boolean;
}) {
  const [form, setForm] = useState<SmtpConfigData>(initialConfig ?? DEFAULT_CONFIG);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  function setField<K extends keyof SmtpConfigData>(key: K, value: SmtpConfigData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function buildPayload(action: string, includeTestEmail = false) {
    const payload: Record<string, unknown> = {
      action,
      host: form.host,
      port: Number(form.port),
      secure: form.secure,
      username: form.username,
      fromName: form.fromName,
      fromEmail: form.fromEmail,
      replyTo: form.replyTo || null,
      enabled: form.enabled,
      notifyLeaveApproval: form.notifyLeaveApproval,
      notifyExpenseApproval: form.notifyExpenseApproval,
      notifyAdvanceApproval: form.notifyAdvanceApproval,
      notifyPayroll: form.notifyPayroll,
      notifyPasswordReset: form.notifyPasswordReset,
      notifyAccountActivation: form.notifyAccountActivation,
    };
    if (passwordChanged) {
      payload.password = form.password;
    }
    if (includeTestEmail && testEmail) {
      payload.testEmail = testEmail;
    }
    return payload;
  }

  async function callApi(payload: Record<string, unknown>) {
    const res = await fetch("/api/settings/smtp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || "Request failed");
    }
    return data;
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await callApi(buildPayload("save"));
      setMessage({ type: "success", text: "Configuration saved successfully." });
      setPasswordChanged(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save configuration." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setMessage(null);
    try {
      const data = await callApi(buildPayload("test_connection"));
      if (data.success) {
        setMessage({ type: "success", text: "SMTP connection test successful." });
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Connection test failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Connection test failed." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail) {
      setMessage({ type: "error", text: "Please enter a test email address." });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const data = await callApi(buildPayload("send_test", true));
      if (data.success) {
        setMessage({ type: "success", text: `Test email sent to ${testEmail}.` });
        setPasswordChanged(false);
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Failed to send test email." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send test email." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Status / last test info */}
      {form.lastTestAt && (
        <div className="card flex items-center gap-3 p-4">
          {form.lastTestStatus === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <div className="text-sm">
            <span className="font-medium text-ink-900">Last test:</span>{" "}
            <span className="text-ink-600">{form.lastTestStatus === "success" ? "Successful" : "Failed"}</span>
            <span className="text-ink-400"> · {formatDate(form.lastTestAt)}</span>
            {form.lastTestError && (
              <div className="mt-1 text-red-600">{form.lastTestError}</div>
            )}
          </div>
        </div>
      )}

      {/* Message banner */}
      {message && (
        <div
          className={`card flex items-center gap-3 p-4 ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={`text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
            {message.text}
          </span>
        </div>
      )}

      {/* SMTP Server */}
      <div className="card p-6">
        <h2 className="section-title">SMTP Server</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Host</label>
            <input
              className="input"
              placeholder="smtp.example.com"
              value={form.host}
              onChange={(e) => setField("host", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Port</label>
            <input
              className="input"
              type="number"
              value={form.port}
              onChange={(e) => setField("port", Number(e.target.value))}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={form.secure}
                onChange={(e) => setField("secure", e.target.checked)}
                className="h-4 w-4 rounded border-ink-300"
              />
              Use SSL/TLS (secure)
            </label>
          </div>
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              placeholder="username@example.com"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder={hasPassword ? "••••••••" : "Enter password"}
              value={passwordChanged ? form.password : ""}
              onChange={(e) => {
                setField("password", e.target.value);
                setPasswordChanged(true);
              }}
              onFocus={() => {
                if (!passwordChanged) setPasswordChanged(true);
              }}
            />
            {hasPassword && !passwordChanged && (
              <p className="mt-1 text-xs text-ink-500">Password is set. Enter a new value to change it.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sender Identity */}
      <div className="card p-6">
        <h2 className="section-title">Sender Identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">From Name</label>
            <input
              className="input"
              placeholder="WorkHub"
              value={form.fromName}
              onChange={(e) => setField("fromName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">From Email</label>
            <input
              className="input"
              type="email"
              placeholder="noreply@example.com"
              value={form.fromEmail}
              onChange={(e) => setField("fromEmail", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Reply-To (optional)</label>
            <input
              className="input"
              type="email"
              placeholder="support@example.com"
              value={form.replyTo ?? ""}
              onChange={(e) => setField("replyTo", e.target.value || null)}
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card p-6">
        <h2 className="section-title">Notification Preferences</h2>
        <p className="mt-1 text-sm text-ink-500">Choose which events trigger email notifications.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {NOTIFICATION_TYPES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={(e) => setField(key, e.target.checked as never)}
                className="h-4 w-4 rounded border-ink-300"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Enable / Disable */}
      <div className="card p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setField("enabled", e.target.checked)}
            className="h-4 w-4 rounded border-ink-300"
          />
          <div>
            <span className="text-sm font-medium text-ink-900">Enable SMTP</span>
            <p className="text-xs text-ink-500">When enabled, the system will send emails through this SMTP server.</p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h2 className="section-title">Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Test Email Address</label>
            <input
              className="input"
              type="email"
              placeholder="recipient@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Configuration
          </button>
          <button onClick={handleTestConnection} disabled={testing} className="btn-secondary">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />} Test Connection
          </button>
          <button onClick={handleSendTestEmail} disabled={sending} className="btn-secondary">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Test Email
          </button>
        </div>
      </div>

      {/* Email Log */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3">
          <Mail className="h-4 w-4 text-ink-500" />
          <h2 className="text-sm font-semibold text-ink-900">Email Log</h2>
          <span className="text-xs text-ink-500">({emailLogs.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Type</th>
                <th>To</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-ink-500">
                    No emails sent yet.
                  </td>
                </tr>
              )}
              {emailLogs.map((log) => (
                <tr key={log.id}>
                  <td data-label="Type" className="font-medium text-ink-900">
                    {log.type.replace(/_/g, " ").toLowerCase()}
                  </td>
                  <td data-label="To">{log.toEmail}</td>
                  <td data-label="Subject">{log.subject}</td>
                  <td data-label="Status">
                    <span
                      className={`badge ${
                        log.status === "SENT"
                          ? "bg-emerald-50 text-emerald-700"
                          : log.status === "FAILED"
                          ? "bg-red-50 text-red-700"
                          : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td data-label="Date">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
