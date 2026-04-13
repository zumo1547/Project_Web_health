import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/components/forms/register-form";
import { getDefaultPortalPath } from "@/lib/permissions";

const registerBenefits = [
  "สแกนยาและบันทึกความดันจากหน้าเดียว โดยไม่ต้องเปิดหลายเมนูให้สับสน",
  "เก็บข้อมูลสุขภาพย้อนหลังไว้ในแฟ้มส่วนตัว เพื่อกลับมาดูผลเดิมได้ทุกเมื่อ",
  "ส่งข้อมูลให้คุณหมอหรือถาม AI ต่อได้ง่าย เมื่อมีอาการผิดปกติหรืออยากขอคำแนะนำ",
];

const registerReasons = [
  "กรอกข้อมูลพื้นฐานให้ครบตั้งแต่ครั้งแรก เพื่อให้แฟ้มสุขภาพส่วนตัวพร้อมใช้งานทันที",
  "ใช้รหัสผ่านแบบปลอดภัยและกลับมาเข้าสู่ระบบด้วยอีเมลเดิมได้ทุกครั้ง",
  "เหมาะกับผู้สูงอายุที่ต้องการเริ่มใช้งานอย่างเป็นขั้นตอน และให้คนในครอบครัวช่วยกรอกข้อมูลได้",
];

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "ELDERLY" && session.user.onboardingRequired) {
      redirect("/complete-profile");
    }

    redirect(getDefaultPortalPath(session.user.role));
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.16),transparent_30%),linear-gradient(180deg,#fbfffd_0%,#eef7f1_56%,#f8efe2_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1320px] items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(540px,0.96fr)] lg:items-center xl:gap-12">
          <section className="page-section-animate relative overflow-hidden rounded-[2.6rem] border border-white/18 bg-[linear-gradient(145deg,#065f46_0%,#0f172a_55%,#0f766e_100%)] px-7 py-8 text-white shadow-[0_36px_120px_-64px_rgba(15,23,42,0.72)] sm:px-9 sm:py-10 lg:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_22%)]" />
            <div className="relative space-y-8">
              <div className="space-y-5">
                <span className="inline-flex rounded-full border border-white/14 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-emerald-100">
                  สมัครใช้งานแอป
                </span>

                <div className="space-y-4">
                  <h1 className="max-w-3xl text-[2.8rem] font-black tracking-tight text-white sm:text-[3.25rem] lg:text-[3.7rem]">
                    สร้างบัญชีผู้สูงอายุ
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/84 sm:text-[1.06rem]">
                    เริ่มใช้แฟ้มสุขภาพส่วนตัวได้จากหน้านี้เพียงหน้าเดียว กรอกข้อมูลพื้นฐานให้ครบ แล้วระบบจะพาคุณไปเริ่มบันทึกยา ความดัน และข้อมูลสุขภาพย้อนหลังได้ทันที
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {["ผู้สูงอายุทั่วไป", "ใช้งานง่ายบนมือถือ", "พร้อมเริ่มใช้ทันที"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white/92"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="rounded-[1.9rem] bg-white/10 p-5 text-white/92 ring-1 ring-white/12 sm:p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/65">
                    เว็บนี้ช่วยอะไรได้บ้าง
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-7 sm:text-[0.98rem]">
                    {registerBenefits.map((item, index) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/14 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="text-white/88">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.9rem] bg-white/10 p-5 text-white/92 ring-1 ring-white/12 sm:p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/65">
                    ทำไมถึงควรใช้
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-white/88">
                    {registerReasons.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[1.35rem] border border-white/14 bg-white/10 p-4">
                    <p className="text-sm font-semibold text-white">มีบัญชีอยู่แล้ว?</p>
                    <p className="mt-2 text-sm leading-7 text-white/78">
                      หากเคยสมัครไว้แล้ว สามารถกลับไปหน้าเข้าสู่ระบบด้วยอีเมลและรหัสผ่านเดิมได้ทันที
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/login"
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[1.2rem] border border-white/14 bg-white/12 px-5 py-3 text-sm font-bold text-emerald-100 transition hover:bg-white/18 hover:text-white"
                      >
                        มีบัญชีอยู่แล้ว เข้าสู่ระบบ
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="page-section-animate lg:justify-self-end" data-delay="1">
            <RegisterForm
              defaultRole="ELDERLY"
              submitLabel="สมัครสมาชิกและเริ่มใช้งาน"
              callbackUrl="/elderly-portal"
              title="สร้างบัญชีผู้สูงอายุ"
              description="กรอกข้อมูลพื้นฐานให้ครบ เพื่อเริ่มใช้งานแฟ้มสุขภาพส่วนตัวได้ทันที"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
