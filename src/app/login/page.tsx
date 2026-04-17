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
    process.env.AUTH_LINE_ID && process.env.AUTH_LINE_SECRET ? "line" : null,
  ].filter(Boolean) as ("google" | "facebook" | "line")[];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%),linear-gradient(180deg,#fbfffd_0%,#eff8f3_56%,#f8efe3_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1320px] items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)] lg:items-center xl:gap-10">
          <AuthShowcase
            eyebrow="แอปตรวจสุขภาพผู้สูงอายุ"
            title="เข้าสู่ระบบผู้สูงอายุ"
            description="ดูแลเรื่องยา ความดัน และประวัติสุขภาพได้จากหน้าเดียว พร้อมขอคำแนะนำจาก AI หรือส่งต่อข้อมูลให้คุณหมอดูได้ทันที ใช้งานง่าย อ่านสบาย และเหมาะกับทั้งคอมและมือถือ"
            supportItems={[
              "สแกนรูปยาและค่าความดันจากรูป เพื่อช่วยอ่านและสรุปข้อมูลเบื้องต้นได้รวดเร็ว",
              "เก็บประวัติสุขภาพ ยาที่ใช้ และบันทึกสำคัญไว้ดูย้อนหลังได้ในที่เดียว",
              "คุยกับ AI หรือส่งอาการให้คุณหมอดูต่อได้ทันที เมื่อต้องการคำแนะนำเพิ่มเติม",
            ]}
            audienceItems={["ผู้สูงอายุ", "ครอบครัว", "ผู้ดูแลสุขภาพ"]}
            quickLinks={[{ href: "/register", label: "ยังไม่มีบัญชี? สมัครสมาชิก" }]}
            tone="sky"
          />

          <div className="page-section-animate lg:justify-self-end" data-delay="1">
            <LoginForm
              defaultCallbackUrl={callbackUrl ?? "/elderly-portal"}
              portal="USER"
              accent="user"
              socialProviders={socialProviders}
              title="เข้าสู่แอปผู้สูงอายุ"
              description="เลือกวิธีเข้าสู่ระบบที่สะดวกที่สุด แล้วเริ่มบันทึกข้อมูลสุขภาพได้ทันที"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
