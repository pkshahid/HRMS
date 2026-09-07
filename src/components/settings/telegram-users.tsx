"use client";

import { useState } from "react";
import { Users, Send, Trash2, Edit2, Check, X, Loader2, ExternalLink } from "lucide-react";

export type TelegramUserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  telegramNotify: boolean;
  employee?: { firstName: string | null; lastName: string | null; employeeCode: string | null } | null;
};

type Message = { type: "success" | "error"; text: string } | null;

export function TelegramUsers({
  users: initialUsers,
  botUsername,
  enabled,
}: {
  users: TelegramUserData[];
  botUsername: string | null;
  enabled: boolean;
}) {
  const [users, setUsers] = useState<TelegramUserData[]>(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chatIdInput, setChatIdInput] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function callApi(method: string, body: Record<string, unknown>) {
    const res = await fetch("/api/settings/telegram/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || "Request failed");
    }
    return data;
  }

  function startEdit(user: TelegramUserData) {
    setEditingId(user.id);
    setChatIdInput(user.telegramChatId ?? "");
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setChatIdInput("");
  }

  async function saveChatId(user: TelegramUserData) {
    setBusyId(user.id);
    setMessage(null);
    try {
      await callApi("PUT", {
        userId: user.id,
        telegramChatId: chatIdInput || null,
        telegramNotify: user.telegramNotify,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, telegramChatId: chatIdInput || null } : u)),
      );
      setMessage({ type: "success", text: `Chat ID updated for ${user.name ?? user.email}.` });
      cancelEdit();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update chat ID." });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleNotify(user: TelegramUserData, value: boolean) {
    setBusyId(user.id);
    setMessage(null);
    try {
      await callApi("PUT", {
        userId: user.id,
        telegramChatId: user.telegramChatId,
        telegramNotify: value,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, telegramNotify: value } : u)));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update notification preference." });
    } finally {
      setBusyId(null);
    }
  }

  async function removeChatId(user: TelegramUserData) {
    setBusyId(user.id);
    setMessage(null);
    try {
      await callApi("PUT", {
        userId: user.id,
        telegramChatId: null,
        telegramNotify: false,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, telegramChatId: null, telegramNotify: false } : u,
        ),
      );
      setMessage({ type: "success", text: `Telegram link removed for ${user.name ?? user.email}.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to remove Telegram link." });
    } finally {
      setBusyId(null);
    }
  }

  async function sendTest(user: TelegramUserData) {
    setBusyId(user.id);
    setMessage(null);
    try {
      const data = await callApi("POST", { userId: user.id });
      if (data.success) {
        setMessage({ type: "success", text: `Test message sent to ${user.name ?? user.email}.` });
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Failed to send test message." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send test message." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header / instructions */}
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-ink-500" />
          <h2 className="section-title">Telegram Users</h2>
        </div>
        <p className="mt-2 text-sm text-ink-500">
          Users can link their Telegram by starting a chat with the bot. After linking, their chat ID will appear here.
        </p>
        {botUsername && (
          <a
            href={`https://t.me/${botUsername}?start=link`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-4 inline-flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" /> Open Bot to Link Account
          </a>
        )}
        {!enabled && (
          <p className="mt-3 text-xs text-amber-600">
            Telegram notifications are disabled. Enable the bot in the configuration above to activate.
          </p>
        )}
      </div>

      {/* Message banner */}
      {message && (
        <div
          className={`card flex items-center gap-3 p-4 ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-5 w-5 text-emerald-600" />
          ) : (
            <X className="h-5 w-5 text-red-600" />
          )}
          <span className={`text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
            {message.text}
          </span>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Telegram Chat ID</th>
                <th>Notifications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-ink-500">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="Name" className="font-medium text-ink-900">
                    {user.name ?? user.email}
                  </td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role">{user.role}</td>
                  <td data-label="Telegram Chat ID">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="input"
                          placeholder="Chat ID"
                          value={chatIdInput}
                          onChange={(e) => setChatIdInput(e.target.value)}
                        />
                        <button
                          onClick={() => saveChatId(user)}
                          disabled={busyId === user.id}
                          className="btn-secondary !px-2"
                          aria-label="Save chat ID"
                        >
                          {busyId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn-secondary !px-2"
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : user.telegramChatId ? (
                      <span className="font-mono text-xs text-ink-700">{user.telegramChatId}</span>
                    ) : (
                      <span className="text-ink-400">Not linked</span>
                    )}
                  </td>
                  <td data-label="Notifications">
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={user.telegramNotify}
                        onChange={(e) => toggleNotify(user, e.target.checked)}
                        disabled={busyId === user.id || !user.telegramChatId}
                        className="h-4 w-4 rounded border-ink-300"
                      />
                      {user.telegramNotify ? "On" : "Off"}
                    </label>
                  </td>
                  <td data-label="Actions">
                    <div className="flex flex-wrap items-center gap-2">
                      {editingId !== user.id && (
                        <button
                          onClick={() => startEdit(user)}
                          disabled={busyId === user.id}
                          className="btn-secondary !px-2"
                          aria-label="Set chat ID"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {user.telegramChatId && editingId !== user.id && (
                        <>
                          <button
                            onClick={() => sendTest(user)}
                            disabled={busyId === user.id}
                            className="btn-secondary !px-2"
                            aria-label="Send test message"
                          >
                            {busyId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => removeChatId(user)}
                            disabled={busyId === user.id}
                            className="btn-secondary !px-2 text-red-600"
                            aria-label="Remove Telegram link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
