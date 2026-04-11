import { auth } from "@/auth";
import { getDefaultPortalPath } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ELDERLY" && session.user.onboardingRequired) {
    redirect("/complete-profile");
  }

  redirect(getDefaultPortalPath(session.user.role));
}
