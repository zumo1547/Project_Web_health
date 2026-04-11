import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";
import { getDefaultPortalPath } from "@/lib/permissions";
import Link from "next/link";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.16),transparent_24%),linear-gradient(180deg,#fffdf7_0%,#f5f7ef_100%)]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="space-y-6">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            แอปตรวจสุขภาพผู้สูงอายุ
          </p>
          <h1 className="max-w-3xl text-[2.7rem] font-black tracking-tight text-slate-950 md:text-[4.1rem]">
            เข้าสู่ระบบผู้สูงอายุ
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            ใช้สำหรับตรวจความดัน สแกนยา บันทึกอาการ ดูแฟ้มสุขภาพ และคุยกับคุณหมอหรือ AI ได้จากหน้าเดียว
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
              <p className="text-base font-bold text-slate-950">หลังเข้าสู่ระบบ</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                <p>1. เริ่มตรวจความดันหรือสแกนยาได้ทันที</p>
                <p>2. ดูสรุปสุขภาพล่าสุดจากข้อมูลที่บันทึกไว้</p>
                <p>3. ปรึกษาคุณหมอหรือถาม AI เพิ่มได้ตลอดเวลา</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
              <p className="text-base font-bold text-slate-950">ทางเข้าอื่น</p>
              <div className="mt-4 space-y-3 text-sm">
                <Link href="/doctor-login" className="block font-bold text-slate-900">
                  เข้าสู่ระบบคุณหมอ
                </Link>
                <Link href="/admin-login" className="block font-bold text-slate-900">
                  เข้าสู่ระบบแอดมิน
                </Link>
                <Link href="/register" className="block font-bold text-emerald-700">
                  สมัครผู้สูงอายุด้วยอีเมล
                </Link>
              </div>
            </div>
          </div>
        </section>

        <LoginForm
          defaultCallbackUrl={callbackUrl ?? "/elderly-portal"}
          portal="USER"
          accent="user"
          socialProviders={socialProviders}
          title="เข้าสู่แอปผู้สูงอายุ"
          description="กรอกอีเมลและรหัสผ่านเดิม หรือใช้ Google / Facebook เพื่อเริ่มใช้งานได้เร็วขึ้น"
        />
      </div>
    </div>
  );
}
