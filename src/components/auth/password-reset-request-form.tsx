"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 sm:p-7">
      <h2 className="text-base font-semibold text-ink-900 sm:text-lg">Reset your password</h2>
      <p className="mt-1 text-sm text-ink-500">Enter your email and we&apos;ll send you a reset link.</p>

      {success ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            If an account exists with that email, a password reset link has been sent.
          </div>
          <Link href="/login" className="btn-secondary w-full text-center">
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input"
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-brand-600 hover:text-brand-700">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
