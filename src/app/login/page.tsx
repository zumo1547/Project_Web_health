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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#fbfffd_0%,#eef8f3_56%,#f8efe3_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1320px] gap-6 px-4 py-7 sm:px-6 md:py-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,40rem)] lg:items-center lg:gap-9 lg:px-8">
        <AuthShowcase
          eyebrow="ศูนย์สุขภาพผู้สูงอายุ"
          title="เข้าสู่ระบบผู้สูงอายุ"
          description="ดูแลสุขภาพจากหน้าเดียวได้ทันที บันทึกความดัน อัปโหลดรูปยา ขอคำแนะนำจาก AI และส่งข้อมูลให้คุณหมอได้ง่าย ออกแบบให้ปุ่มใหญ่ ตัวอักษรชัด เหมาะกับผู้สูงอายุและผู้ดูแล"
          supportItems={[
            "รวมประวัติสุขภาพไว้ในที่เดียว ค้นหาง่าย ไม่สับสน",
            "บันทึกค่าความดันและผลสรุปสุขภาพแบบอ่านเข้าใจง่าย",
            "อัปโหลดรูปยาให้ AI ช่วยสรุปข้อมูลเบื้องต้นก่อนพบแพทย์",
            "ส่งข้อความขอคำปรึกษาคุณหมอ และติดตามนัดหมายได้สะดวก",
          ]}
          audienceItems={["ผู้สูงอายุ", "ครอบครัวและผู้ดูแล", "ผู้ที่ต้องติดตามสุขภาพประจำวัน"]}
          startSteps={[
            "1. เลือกวิธีเข้าสู่ระบบที่สะดวกที่สุด (อีเมล หรือ Google/Facebook/LINE)",
            "2. เข้าสู่หน้าพอร์ทัลเพื่อเริ่มบันทึกข้อมูลสุขภาพ",
            "3. หากเป็นครั้งแรก ระบบจะพาไปกรอกข้อมูลพื้นฐานก่อนใช้งาน",
          ]}
          quickLinks={[
            { href: "/register", label: "ยังไม่มีบัญชี? สมัครสมาชิกที่นี่" },
            { href: "/start", label: "กลับหน้าเริ่มใช้งาน" },
          ]}
          tone="sky"
        />

        <div className="page-section-animate lg:justify-self-end" data-delay="1">
          <LoginForm
            defaultCallbackUrl={callbackUrl ?? "/elderly-portal"}
            portal="USER"
            accent="user"
            socialProviders={socialProviders}
            title="เข้าสู่แอปผู้สูงอายุ"
            description="เลือกวิธีเข้าสู่ระบบที่สะดวก แล้วเริ่มบันทึกข้อมูลสุขภาพได้ทันที"
          />
        </div>
      </div>
    </main>
  );
}
