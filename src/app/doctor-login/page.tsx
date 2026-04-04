import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";
import { getDefaultPortalPath } from "@/lib/permissions";
import Link from "next/link";
import { redirect } from "next/navigation";

type DoctorLoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function DoctorLoginPage({
  searchParams,
}: DoctorLoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultPortalPath(session.user.role));
  }

  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_24%),linear-gradient(180deg,#f8fdff_0%,#edf4f8_100%)]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="space-y-6">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-700">
            Doctor Login
          </p>
          <h1 className="max-w-3xl text-[2.7rem] font-black tracking-tight text-slate-950 md:text-[4.1rem]">
            เข้าสู่ระบบคุณหมอ
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            ใช้สำหรับคุณหมอที่ต้องการรับเคส ดูแฟ้มย้อนหลัง ตอบแชทผู้สูงอายุ
            และติดตามข้อมูลสุขภาพของคนไข้หลายเคสพร้อมกัน
          </p>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-base font-bold text-slate-950">สิ่งที่ทำได้ในพอร์ทัลคุณหมอ</p>
            <div className="mt-4 space-y-2 text-base leading-8 text-slate-700">
              <p>1. เห็นคิวรอรับเคสพร้อมข้อความย่อจากผู้สูงอายุ</p>
              <p>2. เปิดดูแฟ้มย้อนหลังและแชทภายในเคสเดียวกัน</p>
              <p>3. ปิดเคสเมื่อดูแลเสร็จและรับเคสอื่นต่อได้</p>
            </div>
            <div className="mt-5 text-sm">
              <Link href="/start" className="font-bold text-slate-900">
                กลับไปหน้าเริ่มใช้งาน
              </Link>
              {" | "}
              <Link href="/admin-login" className="font-bold text-slate-900">
                ไปหน้าแอดมิน
              </Link>
            </div>
          </div>
        </section>

        <LoginForm
          defaultCallbackUrl={callbackUrl ?? "/doctor"}
          portal="DOCTOR"
          accent="doctor"
          title="เข้าสู่ระบบคุณหมอ"
          description="สำหรับคุณหมอที่มีบัญชีอยู่ในระบบและต้องการเปิดดูคิวหรือแฟ้มคนไข้"
        />
      </div>
    </div>
  );
}
