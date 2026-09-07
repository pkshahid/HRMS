import Link from "next/link";
import { AccountActivationForm } from "@/components/auth/account-activation-form";
import { WorkHubLogo } from "@/components/logo";

export default function ActivatePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-900 via-ink-900 to-brand-950 px-4 py-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <WorkHubLogo className="h-10 w-10 sm:h-12 sm:w-12" />
          <h1 className="mt-3 text-xl font-semibold text-white sm:text-2xl">WorkHub</h1>
          <p className="text-xs text-ink-400 sm:text-sm">Attendance · Payroll · Vacation</p>
        </div>

        {!token ? (
          <div className="card p-5 sm:p-7">
            <h2 className="text-base font-semibold text-ink-900 sm:text-lg">Invalid activation link</h2>
            <p className="mt-1 text-sm text-ink-500">
              The account activation link is invalid or has expired.
            </p>
            <div className="mt-6">
              <Link href="/login" className="btn-primary w-full text-center">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <AccountActivationForm token={token} />
        )}
      </div>
    </div>
  );
}
