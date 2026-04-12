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
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
          <AuthShowcase
            eyebrow="แอปตรวจสุขภาพผู้สูงอายุ"
            title="เข้าสู่ระบบผู้สูงอายุ"
            description="เว็บนี้ช่วยตรวจยา อ่านค่าความดัน เก็บแฟ้มสุขภาพย้อนหลัง และติดต่อ AI หรือคุณหมอได้จากหน้าเดียว โดยออกแบบให้ใช้งานง่ายทั้งมือถือและคอมพิวเตอร์"
            supportItems={[
              "ถ่ายรูปยาและค่าความดันเพื่อให้ระบบช่วยสรุปข้อมูลเบื้องต้นได้",
              "เก็บประวัติสุขภาพ รายการยา และข้อความสำคัญไว้ดูย้อนหลังได้ตลอดเวลา",
              "ขอคำแนะนำจาก AI หรือส่งข้อมูลให้คุณหมอดูต่อได้ทันทีเมื่อมีอาการผิดปกติ",
            ]}
            audienceItems={["ผู้สูงอายุ", "ลูกหลานหรือผู้ดูแล", "คุณหมอและแอดมิน"]}
            quickLinks={[
              { href: "/doctor-login", label: "เข้าสู่ระบบคุณหมอ" },
              { href: "/admin-login", label: "เข้าสู่ระบบแอดมิน" },
              { href: "/register", label: "สมัครผู้สูงอายุด้วยอีเมล" },
            ]}
            tone="sky"
          />

          <div className="page-section-animate" data-delay="1">
            <LoginForm
              defaultCallbackUrl={callbackUrl ?? "/elderly-portal"}
              portal="USER"
              accent="user"
              socialProviders={socialProviders}
              title="เข้าสู่แอปผู้สูงอายุ"
              description="เลือกเข้าสู่ระบบด้วยอีเมลเดิม หรือใช้ Google / Facebook เพื่อเริ่มใช้งานได้รวดเร็วขึ้น"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
