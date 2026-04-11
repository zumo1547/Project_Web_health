import { auth } from "@/auth";
import { RegisterForm } from "@/components/forms/register-form";
import { getDefaultPortalPath } from "@/lib/permissions";
import Link from "next/link";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.16),transparent_24%),linear-gradient(180deg,#fffef8_0%,#f2f7ef_100%)]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="space-y-6">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            สมัครใช้งานแอป
          </p>
          <h1 className="max-w-3xl text-[2.7rem] font-black tracking-tight text-slate-950 md:text-[4.1rem]">
            สมัครแอปตรวจสุขภาพผู้สูงอายุ
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            สมัครได้เฉพาะผู้สูงอายุทั่วไปเท่านั้น ไม่ต้องเลือกประเภทบัญชีให้สับสน สมัครเสร็จแล้วระบบจะพาเข้าสู่หน้าแอปของคุณทันที
          </p>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-base font-bold text-slate-950">
              หลังสมัครเสร็จทำอะไรได้บ้าง
            </p>
            <div className="mt-4 space-y-2 text-base leading-8 text-slate-700">
              <p>1. เริ่มตรวจความดันและสแกนยาได้ทันที</p>
              <p>2. ดูแฟ้มสุขภาพย้อนหลังและสถิติของตัวเอง</p>
              <p>3. ถาม AI หรือส่งข้อความหาคุณหมอเพื่อขอคำแนะนำได้</p>
            </div>
            <div className="mt-5 text-sm">
              <Link href="/login" className="font-bold text-emerald-700">
                มีบัญชีอยู่แล้ว? เข้าสู่แอปผู้สูงอายุ
              </Link>
            </div>
          </div>
        </section>

        <RegisterForm
          defaultRole="ELDERLY"
          showRoleSelect={false}
          submitLabel="สมัครและเริ่มใช้งาน"
          callbackUrl="/elderly-portal"
          title="สร้างบัญชีผู้สูงอายุ"
          description="กรอกข้อมูลพื้นฐานเพื่อเริ่มใช้งานแอปตรวจสุขภาพส่วนตัว"
        />
      </div>
    </div>
  );
}
