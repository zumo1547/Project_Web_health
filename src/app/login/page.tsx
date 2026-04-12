import { auth } from "@/auth";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { LoginForm } from "@/components/forms/login-form";
import { getDefaultPortalPath } from "@/lib/permissions";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "ELDERLY" && session.user.onboardingRequired) {
      redirect("/complete-profile");
    }

    redirect(getDefaultPortalPath(session.user.role));
  }

  const { callbackUrl } = await searchParams;
  const socialProviders = [
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? "google" : null,
    process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
      ? "facebook"
      : null,
  ].filter(Boolean) as ("google" | "facebook")[];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#f8fffc_0%,#eef8f2_54%,#f7efe1_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.86fr)] lg:items-center">
          <AuthShowcase
            eyebrow="แอปตรวจสุขภาพผู้สูงอายุ"
            title="เข้าสู่ระบบผู้สูงอายุ"
            description="ใช้ตรวจความดัน สแกนยา เก็บข้อมูลสุขภาพย้อนหลัง และขอคำแนะนำจาก AI ได้จากหน้าเดียว ออกแบบให้ใช้งานง่ายทั้งบนมือถือและคอมพิวเตอร์"
            supportItems={[
              "สแกนรูปยาและรูปค่าความดันเพื่อให้ระบบช่วยอ่านและสรุปข้อมูลเบื้องต้น",
              "เก็บประวัติสุขภาพ รายการยา และข้อมูลสำคัญไว้ดูย้อนหลังได้ตลอดเวลา",
              "ขอคำแนะนำจาก AI หรือส่งข้อมูลให้คุณหมอดูต่อได้ทันทีเมื่อมีอาการผิดปกติ",
            ]}
            audienceItems={["ผู้สูงอายุ", "ครอบครัว", "ผู้ดูแลสุขภาพ"]}
            quickLinks={[{ href: "/register", label: "ยังไม่มีบัญชี? สมัครสมาชิก" }]}
            quickLinksTitle="เริ่มต้นสำหรับผู้ใช้ใหม่"
            tone="sky"
          />

          <div className="page-section-animate" data-delay="1">
            <LoginForm
              defaultCallbackUrl={callbackUrl ?? "/elderly-portal"}
              portal="USER"
              accent="user"
              socialProviders={socialProviders}
              title="เข้าสู่แอปผู้สูงอายุ"
              description="เข้าสู่ระบบด้วยอีเมลเดิม หรือใช้ Google / Facebook เพื่อเริ่มใช้งานได้อย่างรวดเร็ว"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
