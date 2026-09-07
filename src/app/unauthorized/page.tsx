import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-semibold text-ink-900">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        You don&apos;t have permission to view this page. Please contact your administrator if you
        believe this is an error.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
