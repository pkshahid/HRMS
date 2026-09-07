import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireAuth();
  if (user.employeeId) redirect(`/employees/${user.employeeId}`);
  // super admin / staff without employee profile
  redirect("/dashboard");
}
