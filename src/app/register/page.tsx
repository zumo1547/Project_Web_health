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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_28%),linear-gradient(180deg,#fbfffd_0%,#eef8f2_56%,#f8efe2_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1320px] gap-6 px-4 py-7 sm:px-6 md:py-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,40rem)] lg:items-center lg:gap-9 lg:px-8">
        <AuthShowcase
          eyebrow="เริ่มสมัครสมาชิก"
          title="สร้างบัญชีผู้สูงอายุ"
          description="สมัครสมาชิกครั้งเดียว แล้วเริ่มใช้งานเครื่องมือสุขภาพได้ทันที เหมาะกับผู้สูงอายุและครอบครัวที่ต้องการดูแลสุขภาพแบบใช้ง่าย ไม่ซับซ้อน"
          supportItems={[
            "สมัครง่ายด้วยข้อมูลสำคัญที่จำเป็นเท่านั้น",
            "ระบบจะพาไปกรอกข้อมูลทั่วไปต่อในขั้นตอนถัดไป",
            "หลังสมัครแล้วเริ่มบันทึกความดัน อัปโหลดรูปยา และปรึกษาแพทย์ได้ทันที",
            "หน้าจอออกแบบให้อ่านง่ายและกดใช้งานสะดวกบนมือถือ",
          ]}
          audienceItems={["ผู้สูงอายุทั่วไป", "ครอบครัวผู้ดูแล", "ผู้เริ่มใช้แอปครั้งแรก"]}
          startSteps={[
            "1. กรอกชื่อ อีเมล และตั้งรหัสผ่านที่ปลอดภัย",
            "2. ยืนยันเงื่อนไขการใช้งาน แล้วกดสมัครสมาชิก",
            "3. ระบบจะพาไปหน้ากรอกข้อมูลทั่วไปก่อนเข้าใช้งานจริง",
          ]}
          quickLinks={[{ href: "/login", label: "มีบัญชีแล้ว? เข้าสู่ระบบ" }]}
          tone="emerald"
        />

        <div className="page-section-animate lg:justify-self-end" data-delay="1">
          <RegisterForm
            defaultRole="ELDERLY"
            callbackUrl="/complete-profile"
            title="สมัครสมาชิกผู้สูงอายุ"
            description="กรอกข้อมูลพื้นฐานด้านล่างเพื่อสร้างบัญชี แล้วไปต่อขั้นตอนกรอกข้อมูลทั่วไป"
            submitLabel="สมัครสมาชิกและไปกรอกข้อมูลทั่วไป"
            className="w-full max-w-[40rem]"
          />
        </div>
      </div>
    </main>
  );
}
