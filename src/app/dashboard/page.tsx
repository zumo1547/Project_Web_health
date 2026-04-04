import { auth } from "@/auth";
import { getDefaultPortalPath } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(getDefaultPortalPath(session.user.role));
}
