import { auth } from "@/auth";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { RegisterForm } from "@/components/forms/register-form";
import { getDefaultPortalPath } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "ELDERLY" && session.user.onboardingRequired) {
      redirect("/complete-profile");
    }

    redirect(getDefaultPortalPath(session.user.role));
  }

  const socialProviders = [
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? "google" : null,
    process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
      ? "facebook"
      : null,
  ].filter(Boolean) as ("google" | "facebook")[];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_28%),linear-gradient(180deg,#fcfffd_0%,#eff8f3_58%,#f8efe2_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
          <AuthShowcase
            eyebrow="สมัครใช้งานแอป"
            title="สร้างบัญชีผู้สูงอายุ"
            description="สมัครได้ทั้งจากอีเมลหรือบัญชี Google / Facebook แล้วค่อยกรอกข้อมูลพื้นฐานต่อให้ครบ เพื่อเริ่มใช้งานระบบติดตามสุขภาพได้ทันที"
            supportItems={[
              "ใช้ตรวจยา บันทึกความดัน และเก็บข้อมูลสุขภาพประจำวันในที่เดียว",
              "มีแฟ้มสุขภาพย้อนหลังให้กลับมาดูประวัติยา ค่าความดัน และคำแนะนำได้ง่าย",
              "เมื่อต้องการความช่วยเหลือ สามารถถาม AI หรือส่งข้อมูลให้คุณหมอดูต่อได้ทันที",
            ]}
            audienceItems={["ผู้สูงอายุทั่วไป", "ครอบครัวที่ช่วยสมัคร", "ใช้งานง่ายบนมือถือ"]}
            quickLinks={[
              { href: "/login", label: "มีบัญชีอยู่แล้ว เข้าสู่ระบบ" },
              { href: "/doctor-login", label: "เข้าสู่ระบบคุณหมอ" },
              { href: "/admin-login", label: "เข้าสู่ระบบแอดมิน" },
            ]}
            tone="emerald"
          />

          <div className="page-section-animate" data-delay="1">
            <RegisterForm
              defaultRole="ELDERLY"
              showRoleSelect={false}
              submitLabel="สมัครและเริ่มใช้งาน"
              callbackUrl="/elderly-portal"
              title="สร้างบัญชีผู้สูงอายุ"
              description="กรอกข้อมูลพื้นฐานเพื่อเริ่มใช้งานแอปตรวจสุขภาพส่วนตัว"
              socialProviders={socialProviders}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
