"use client";

import { useState } from "react";
import { Send, Save, Plug, MessageCircle, CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export type TelegramConfigData = {
  botToken: string;
  botUsername: string | null;
  welcomeMessage: string;
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

export type TelegramLogData = {
  id: string;
  type: string;
  status: string;
  chatId: string;
  toName: string | null;
  message: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
};

const NOTIFICATION_TYPES: { key: keyof TelegramConfigData; label: string }[] = [
  { key: "notifyLeaveApproval", label: "Leave Approval" },
  { key: "notifyExpenseApproval", label: "Expense Approval" },
  { key: "notifyAdvanceApproval", label: "Advance Approval" },
  { key: "notifyPayroll", label: "Payroll" },
  { key: "notifyPasswordReset", label: "Password Reset" },
  { key: "notifyAccountActivation", label: "Account Activation" },
];

const DEFAULT_CONFIG: TelegramConfigData = {
  botToken: "",
  botUsername: null,
  welcomeMessage: "Welcome to WorkHub Notifications! Your account is now linked.",
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

export function TelegramSettingsForm({
  initialConfig,
  telegramLogs,
  hasToken,
}: {
  initialConfig: TelegramConfigData | null;
  telegramLogs: TelegramLogData[];
  hasToken: boolean;
}) {
  const [form, setForm] = useState<TelegramConfigData>(initialConfig ?? DEFAULT_CONFIG);
  const [tokenChanged, setTokenChanged] = useState(false);
  const [testChatId, setTestChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  function setField<K extends keyof TelegramConfigData>(key: K, value: TelegramConfigData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function buildPayload(action: string, includeTestChatId = false) {
    const payload: Record<string, unknown> = {
      action,
      botToken: tokenChanged ? form.botToken : "__KEEP_EXISTING__",
      botUsername: form.botUsername || null,
      welcomeMessage: form.welcomeMessage,
      enabled: form.enabled,
      notifyLeaveApproval: form.notifyLeaveApproval,
      notifyExpenseApproval: form.notifyExpenseApproval,
      notifyAdvanceApproval: form.notifyAdvanceApproval,
      notifyPayroll: form.notifyPayroll,
      notifyPasswordReset: form.notifyPasswordReset,
      notifyAccountActivation: form.notifyAccountActivation,
    };
    if (includeTestChatId && testChatId) {
      payload.testChatId = testChatId;
    }
    return payload;
  }

  async function callApi(payload: Record<string, unknown>) {
    const res = await fetch("/api/settings/telegram", {
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
      setTokenChanged(false);
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
        setMessage({ type: "success", text: "Telegram connection test successful." });
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Connection test failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Connection test failed." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSendTestMessage() {
    if (!testChatId) {
      setMessage({ type: "error", text: "Please enter a chat ID to send a test message." });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const data = await callApi(buildPayload("send_test", true));
      if (data.success) {
        setMessage({ type: "success", text: `Test message sent to chat ${testChatId}.` });
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Failed to send test message." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send test message." });
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

      {/* Bot Configuration */}
      <div className="card p-6">
        <h2 className="section-title">Bot Configuration</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Bot Token</label>
            <input
              className="input"
              type="password"
              placeholder={hasToken ? "••••••••" : "Enter bot token from @BotFather"}
              value={tokenChanged ? form.botToken : ""}
              onChange={(e) => {
                setField("botToken", e.target.value);
                setTokenChanged(true);
              }}
              onFocus={() => {
                if (!tokenChanged) setTokenChanged(true);
              }}
            />
            {hasToken && !tokenChanged && (
              <p className="mt-1 text-xs text-ink-500">
                Bot token is set. Enter a new value to change it.
              </p>
            )}
            <p className="mt-1 text-xs text-ink-500">
              For security, please re-enter the bot token each time you save.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bot Username (optional)</label>
            <input
              className="input"
              placeholder="my_workhub_bot"
              value={form.botUsername ?? ""}
              onChange={(e) => setField("botUsername", e.target.value || null)}
            />
            <p className="mt-1 text-xs text-ink-500">Auto-filled from the Telegram API on save.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Welcome Message</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Welcome to WorkHub Notifications! Your account is now linked."
              value={form.welcomeMessage}
              onChange={(e) => setField("welcomeMessage", e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-500">The message users see when they start the bot.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setField("enabled", e.target.checked)}
                className="h-4 w-4 rounded border-ink-300"
              />
              <div>
                <span className="text-sm font-medium text-ink-900">Enable Telegram Bot</span>
                <p className="text-xs text-ink-500">When enabled, the system will send notifications through Telegram.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card p-6">
        <h2 className="section-title">Notification Preferences</h2>
        <p className="mt-1 text-sm text-ink-500">Choose which events trigger Telegram notifications.</p>
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

      {/* Test Actions */}
      <div className="card p-6">
        <h2 className="section-title">Test Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Test Chat ID</label>
            <input
              className="input"
              placeholder="123456789"
              value={testChatId}
              onChange={(e) => setTestChatId(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-500">Enter a Telegram chat ID to send a test message to.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Configuration
          </button>
          <button onClick={handleTestConnection} disabled={testing} className="btn-secondary">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />} Test Connection
          </button>
          <button onClick={handleSendTestMessage} disabled={sending} className="btn-secondary">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Test Message
          </button>
        </div>
      </div>

      {/* Telegram Message Log */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3">
          <MessageCircle className="h-4 w-4 text-ink-500" />
          <h2 className="text-sm font-semibold text-ink-900">Telegram Message Log</h2>
          <span className="text-xs text-ink-500">({telegramLogs.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Type</th>
                <th>Chat ID</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {telegramLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-ink-500">
                    <Users className="mx-auto mb-2 h-5 w-5 text-ink-400" />
                    No Telegram messages sent yet.
                  </td>
                </tr>
              )}
              {telegramLogs.map((log) => (
                <tr key={log.id}>
                  <td data-label="Type" className="font-medium text-ink-900">
                    {log.type.replace(/_/g, " ").toLowerCase()}
                  </td>
                  <td data-label="Chat ID">{log.chatId}</td>
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
