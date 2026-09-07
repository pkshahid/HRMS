import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { WorkHubLogo } from "@/components/logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-900 via-ink-900 to-brand-950 px-4 py-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <WorkHubLogo className="h-10 w-10 sm:h-12 sm:w-12" />
          <h1 className="mt-3 text-xl font-semibold text-white sm:text-2xl">WorkHub</h1>
          <p className="text-xs text-ink-400 sm:text-sm">Attendance · Payroll · Vacation</p>
        </div>

        <Suspense fallback={<div className="card p-5 text-sm text-ink-500 sm:p-7">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
