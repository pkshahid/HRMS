"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Bell, Save, Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  telegramNotify: boolean;
};

type TelegramConfigData = {
  botUsername: string | null;
  enabled: boolean;
  welcomeMessage: string;
} | null;

export function MyNotificationsClient({
  user,
  telegramConfig,
}: {
  user: UserData;
  telegramConfig: TelegramConfigData;
}) {
  const router = useRouter();
  const [chatId, setChatId] = useState(user.telegramChatId || "");
  const [username, setUsername] = useState(user.telegramUsername || "");
  const [notify, setNotify] = useState(user.telegramNotify);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/settings/telegram/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramChatId: chatId || null,
        telegramUsername: username || null,
        telegramNotify: notify,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Notification preferences saved successfully." });
      router.refresh();
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to save preferences." });
    }
  }

  const isTelegramEnabled = telegramConfig?.enabled;
  const botUsername = telegramConfig?.botUsername;
  const botLink = botUsername ? `https://t.me/${botUsername}?start=link` : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Telegram Status */}
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-brand-600" />
          <h2 className="section-title">Telegram Notifications</h2>
        </div>

        {!isTelegramEnabled ? (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Telegram notifications are not enabled for your organization. Please contact your administrator.
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-ink-600">
              Receive instant notifications via Telegram for leave approvals, expense updates, advance payments, payroll, and more.
            </p>

            {botLink && (
              <div className="mt-4 rounded-lg bg-brand-50 px-4 py-3">
                <div className="text-sm font-medium text-brand-700">Link your Telegram account</div>
                <p className="mt-1 text-xs text-brand-600">
                  Start a chat with our bot to get your chat ID, then enter it below.
                </p>
                <a
                  href={botLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-3 inline-flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Bot on Telegram
                </a>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Telegram Chat ID</label>
                <input
                  className="input"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g. 123456789"
                />
                <p className="mt-1 text-xs text-ink-400">
                  You can find your chat ID by messaging @{botUsername || "your_bot"} on Telegram.
                </p>
              </div>

              <div>
                <label className="label">Telegram Username (optional)</label>
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-ink-100 p-3">
                <Bell className="h-5 w-5 text-brand-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-900">Receive Telegram notifications</div>
                  <div className="text-xs text-ink-500">Get instant alerts for approvals, payments, and more.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotify(!notify)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notify ? "bg-brand-600" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notify ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>

      {/* Email notifications info */}
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-600" />
          <h2 className="section-title">Email Notifications</h2>
        </div>
        <p className="mt-3 text-sm text-ink-600">
          Email notifications are sent to <strong>{user.email}</strong>. To change your email, please contact your administrator.
        </p>
        <p className="mt-2 text-xs text-ink-400">
          Email notifications are managed by your organization&apos;s SMTP settings. You cannot opt out of email notifications individually.
        </p>
      </div>
    </div>
  );
}
