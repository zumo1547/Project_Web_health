import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDefaultPortalPath } from "@/lib/permissions";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  const primaryHref = session?.user ? getDefaultPortalPath(session.user.role) : "/start";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2.6rem] border border-white/70 bg-white/84 px-6 py-10 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur md:px-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="space-y-7">
            <Badge tone="emerald">แอปตรวจสุขภาพสำหรับผู้สูงอายุที่ใช้งานง่ายจริง</Badge>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-[2.45rem] font-black leading-[1.08] tracking-tight text-slate-950 sm:text-[3.2rem] lg:text-[3.8rem]">
                ตรวจสุขภาพประจำวัน
                <br />
                สำหรับผู้สูงอายุ
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
                ใช้ติดตามความดัน สแกนยา บันทึกอาการ ดูสรุปสุขภาพจาก AI และขอคำแนะนำจากคุณหมอ
                โดยออกแบบให้ตัวอักษรอ่านง่าย ปุ่มกดชัด และรองรับทั้งมือถือกับคอมพิวเตอร์
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref}>
                <Button className="w-full px-8 sm:w-auto">
                  {session?.user ? "ไปยังแอปของฉัน" : "เริ่มตรวจสุขภาพ"}
                </Button>
              </Link>
              {!session?.user ? (
                <Link href="/register">
                  <Button variant="secondary" className="w-full px-8 sm:w-auto">
                    สมัครผู้สูงอายุ
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(240,253,244,0.96)_100%)]">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                เริ่มใช้งานง่าย
              </p>
              <div className="mt-4 space-y-3 text-base leading-8 text-slate-700">
                <p>1. กดเริ่มตรวจสุขภาพและเลือก “ผู้สูงอายุ”</p>
                <p>2. เข้าสู่ระบบหรือสมัครบัญชีใหม่ได้ทันที</p>
                <p>3. เริ่มตรวจความดัน สแกนยา และดูสรุปสุขภาพจากหน้าเดียว</p>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(248,250,252,0.96)_100%)]">
                <p className="text-lg font-extrabold text-slate-950">เหมาะกับผู้สูงอายุ</p>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  ตัวอักษรใหญ่ ช่องกรอกห่างกันชัด และมีคำอธิบายทุกขั้นตอนแบบอ่านแล้วเข้าใจทันที
                </p>
              </Card>
              <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.96)_100%)]">
                <p className="text-lg font-extrabold text-slate-950">เหมือนมีสมุดสุขภาพส่วนตัว</p>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  ข้อมูลความดัน รูปยา ผล AI และประวัติการคุยจะถูกรวมไว้ในแฟ้มสุขภาพเดียวกัน
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
