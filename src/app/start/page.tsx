import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDefaultPortalPath } from "@/lib/permissions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StartPage() {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultPortalPath(session.user.role));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="space-y-5 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
          เริ่มตรวจสุขภาพ
        </p>
        <h1 className="text-[2.4rem] font-black tracking-tight text-slate-950 sm:text-[3.4rem]">
          เลือกทางเข้าใช้งาน
        </h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600">
          หน้าเริ่มต้นนี้จัดให้ผู้สูงอายุเป็นตัวเลือกหลักก่อน
          เพื่อเข้าสู่แอปตรวจสุขภาพได้เร็วที่สุด ส่วนคุณหมอและแอดมินอยู่เป็นส่วนสนับสนุนด้านล่าง
        </p>
      </section>

      <section className="mt-10 space-y-6">
        <Card className="border border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(240,253,244,0.97)_100%)] p-8 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
            ใช้งานเพื่อตรวจสุขภาพประจำวัน
          </p>
          <h2 className="mt-4 text-[2.2rem] font-black tracking-tight text-slate-950 sm:text-[2.8rem]">
            ผู้สูงอายุ
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            เข้าสู่แอปเพื่อตรวจความดัน สแกนยา บันทึกอาการ ดูสรุปสุขภาพ และเปิดแฟ้มสุขภาพย้อนหลัง
            ได้จากที่เดียว
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/login">
              <Button className="w-full px-8 sm:w-auto">เข้าสู่แอปผู้สูงอายุ</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" className="w-full px-8 sm:w-auto">
                สมัครผู้สูงอายุ
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="border border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-700">
            สำหรับติดตามและให้คำแนะนำ
          </p>
          <h2 className="mt-4 text-[2rem] font-black tracking-tight text-slate-950">
            คุณหมอ
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            ใช้รับเคสจากแอปผู้สูงอายุ เปิดดูแฟ้มสุขภาพย้อนหลัง และให้คำแนะนำในแชทแต่ละเคส
          </p>
          <div className="mt-6">
            <Link href="/doctor-login">
              <Button className="w-full bg-slate-950 px-8 hover:bg-slate-800 focus-visible:outline-slate-900 sm:w-auto">
                เข้าสู่ระบบคุณหมอ
              </Button>
            </Link>
          </div>
        </Card>

        <div className="pt-2 text-center">
          <Link href="/admin-login">
            <Button
              variant="ghost"
              className="border border-amber-200 bg-amber-50 px-8 text-amber-900 hover:bg-amber-100"
            >
              เข้าแอดมิน
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
