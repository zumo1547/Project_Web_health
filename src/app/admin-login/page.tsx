import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";
import { getDefaultPortalPath } from "@/lib/permissions";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminLoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultPortalPath(session.user.role));
  }

  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.16),transparent_24%),linear-gradient(180deg,#fffaf0_0%,#f8f1e5_100%)]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="space-y-6">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-700">
            Admin Login
          </p>
          <h1 className="max-w-3xl text-[2.7rem] font-black tracking-tight text-slate-950 md:text-[4.1rem]">
            เข้าสู่ระบบแอดมิน
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            ใช้สำหรับดูแลภาพรวมระบบ จัดการผู้ใช้ เลือกผู้ที่จะเป็นคุณหมอ
            จับคู่หมอกับผู้สูงอายุ และลบข้อมูลที่ไม่ใช้งานแล้ว
          </p>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-base font-bold text-slate-950">งานหลักของแอดมิน</p>
            <div className="mt-4 space-y-2 text-base leading-8 text-slate-700">
              <p>1. ดูรายชื่อผู้ใช้ทั้งหมดและเปลี่ยนบทบาทเป็นคุณหมอได้</p>
              <p>2. จับคู่หรือย้ายคุณหมอกับผู้สูงอายุแต่ละเคสได้</p>
              <p>3. ลบข้อมูลหรือบัญชีที่ไม่ใช้งานออกจากระบบได้</p>
            </div>
            <div className="mt-5 text-sm">
              <Link href="/start" className="font-bold text-slate-900">
                กลับไปหน้าเริ่มใช้งาน
              </Link>
              {" | "}
              <Link href="/doctor-login" className="font-bold text-slate-900">
                ไปหน้าคุณหมอ
              </Link>
            </div>
          </div>
        </section>

        <LoginForm
          defaultCallbackUrl={callbackUrl ?? "/admin"}
          portal="ADMIN"
          accent="admin"
          title="เข้าสู่ระบบแอดมิน"
          description="สำหรับผู้ดูแลระบบที่ต้องการจัดการผู้ใช้ เคส และการเชื่อมต่อระหว่างหมอกับผู้สูงอายุ"
        />
      </div>
    </div>
  );
}
