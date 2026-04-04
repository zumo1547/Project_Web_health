import { auth } from "@/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { AiHealthChatPanel } from "@/components/forms/ai-health-chat-panel";
import { AiScanForm } from "@/components/forms/ai-scan-form";
import { BloodPressureForm } from "@/components/forms/blood-pressure-form";
import { CaseRequestPanel } from "@/components/forms/case-request-panel";
import { ChatPanel } from "@/components/forms/chat-panel";
import { MedicineUploadForm } from "@/components/forms/medicine-upload-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FloatingSupportDock } from "@/components/ui/floating-support-dock";
import { DoctorCaseStatus, Role } from "@/generated/prisma";
import { formatSystemDateTime } from "@/lib/date-time";
import { ensureElderlyProfileForUser } from "@/lib/elderly-profile";
import { getBloodPressureAssessment } from "@/lib/health-presenters";
import { canAccessElderlyPortal } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

function formatDate(date: Date) {
  return formatSystemDateTime(date);
}

function summarizeText(value?: string | null) {
  if (!value) return null;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 117)}...`;
}

export default async function ElderlyPortalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessElderlyPortal(session.user.role)) {
    redirect("/dashboard");
  }

  const ensuredProfile = await ensureElderlyProfileForUser(session.user.id);

  const elderly = await prisma.elderlyProfile.findUniqueOrThrow({
    where: {
      id: ensuredProfile.id,
    },
    include: {
      bloodPressures: {
        orderBy: {
          measuredAt: "desc",
        },
        take: 12,
      },
      aiScans: {
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
      },
      medicineImages: {
        orderBy: {
          uploadedAt: "desc",
        },
        take: 12,
      },
      chatMessages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 24,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
      aiHealthMessages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 24,
      },
      doctors: {
        where: {
          status: DoctorCaseStatus.ACTIVE,
        },
        select: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          bloodPressures: true,
          aiScans: true,
          medicineImages: true,
          chatMessages: true,
          aiHealthMessages: true,
        },
      },
    },
  });

  const latestBloodPressure = elderly.bloodPressures[0];
  const latestAiScan = elderly.aiScans[0];
  const latestMedicine = elderly.medicineImages[0];
  const bloodPressureAssessment = getBloodPressureAssessment(
    latestBloodPressure?.systolic,
    latestBloodPressure?.diastolic,
  );
  const latestDoctor = elderly.doctors[0]?.doctor;
  const latestDoctorMessage = [...elderly.chatMessages]
    .reverse()
    .find((message) => message.senderRole !== Role.ELDERLY);
  const latestAiHealthMessage = [...elderly.aiHealthMessages]
    .reverse()
    .find((message) => message.role === "ASSISTANT");

  return (
    <AppShell
      portal="elderly"
      title={`ศูนย์ตรวจสุขภาพของ ${elderly.firstName}`}
      subtitle="ใช้งานจากหน้าเดียวได้ทั้งตรวจยา บันทึกความดัน ขอคำแนะนำจาก AI และติดต่อคุณหมอ โดยจัดปุ่มสำคัญไว้ให้อยู่ใกล้มือและอ่านง่ายขึ้น"
      user={session.user}
      navigation={[
        { href: "#overview", label: "ภาพรวมวันนี้", eyebrow: "Home" },
        { href: "#actions", label: "เริ่มใช้งานเร็ว", eyebrow: "Quick" },
        { href: "#support", label: "ศูนย์ช่วยเหลือ", eyebrow: "Support" },
        { href: "#scan", label: "สแกนยาและบันทึกรูป", eyebrow: "Scan" },
        { href: "#blood-pressure", label: "ความดัน", eyebrow: "Pressure" },
        { href: "#history", label: "แฟ้มย้อนหลัง", eyebrow: "Record" },
      ]}
      actions={
        <Link
          href={`/elderly/${elderly.id}`}
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.45rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-3 text-base font-bold text-emerald-900 shadow-[0_18px_36px_-28px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-[linear-gradient(135deg,rgba(209,250,229,0.98)_0%,rgba(255,255,255,0.98)_100%)]"
        >
          เปิดแฟ้มสุขภาพ
        </Link>
      }
    >
      <section id="overview" className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98)_0%,rgba(240,253,244,0.96)_100%)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                ประจำวัน
              </div>
              <CardTitle>ศูนย์สั่งงานสุขภาพวันนี้</CardTitle>
              <CardDescription>
                เริ่มจากการสแกนยา ตรวจค่าความดัน หรือเปิดแชทช่วยเหลือได้จากหน้านี้ทันที โดยไม่ต้องเลื่อนหาปุ่มหลายรอบ
              </CardDescription>
            </div>

            <div className="rounded-[1.6rem] border border-emerald-100 bg-white/85 px-4 py-4 text-sm leading-7 text-slate-600">
              <p className="font-bold text-slate-900">สถานะล่าสุด</p>
              <p className="mt-2">
                {latestBloodPressure
                  ? `วัดความดันล่าสุดเมื่อ ${formatDate(latestBloodPressure.measuredAt)}`
                  : "ยังไม่มีการวัดความดันในวันนี้"}
              </p>
              <p className="mt-1">
                {latestDoctor
                  ? `มีคุณหมอดูแลอยู่: ${latestDoctor.name}`
                  : "ยังไม่มีคุณหมอดูแล สามารถกดขอรับเคสได้ในศูนย์ช่วยเหลือ"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link
              href="#scan"
              className="rounded-[1.85rem] border border-white/80 bg-white/88 px-5 py-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.24)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ขั้นที่ 1
              </p>
              <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
                สแกนยา
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                ถ่ายจากกล้องหรือเลือกรูปจากคลังให้ AI ช่วยดูว่าเป็นยาอะไร
              </p>
            </Link>

            <Link
              href="#blood-pressure"
              className="rounded-[1.85rem] border border-white/80 bg-white/88 px-5 py-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.24)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ขั้นที่ 2
              </p>
              <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
                บันทึกความดัน
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                ใส่ค่าด้วยตัวเองหรือสแกนจากรูปเครื่องวัด แล้วให้ระบบช่วยประเมิน
              </p>
            </Link>

            <Link
              href="#support"
              className="rounded-[1.85rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(15,118,110,0.95)_0%,rgba(5,150,105,0.92)_100%)] px-5 py-5 text-white shadow-[0_24px_52px_-34px_rgba(5,150,105,0.55)] transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:bg-[linear-gradient(135deg,rgba(13,148,136,0.96)_0%,rgba(5,150,105,0.94)_100%)]"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-50">
                ขั้นที่ 3
              </p>
              <p className="mt-3 text-xl font-black tracking-tight text-white">
                ขอคำแนะนำต่อ
              </p>
              <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                ใช้ปุ่มลอยมุมขวาล่างเพื่อเปิดแชท AI หรือทักหาคุณหมอได้ทันที
              </p>
            </Link>
          </div>
        </Card>

        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <SummaryCard
              label="ค่าความดันล่าสุด"
              value={
                latestBloodPressure
                  ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic}`
                  : "--/--"
              }
              description={
                latestBloodPressure
                  ? `วัดเมื่อ ${formatDate(latestBloodPressure.measuredAt)}`
                  : "ยังไม่มีข้อมูลความดันล่าสุด"
              }
              tone="elderly"
            />
            <SummaryCard
              label="ผลประเมิน"
              value={bloodPressureAssessment.shortLabel}
              description={bloodPressureAssessment.guidance}
              tone={bloodPressureAssessment.tone === "rose" ? "alert" : "elderly"}
            />
          </div>

          <Card className="border-cyan-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
            <CardTitle>สิ่งที่ระบบจำได้ล่าสุด</CardTitle>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  ผล AI ล่าสุด
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {latestAiScan?.summary ?? "ยังไม่มีผลวิเคราะห์จาก AI"}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  รูปยาล่าสุด
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {latestMedicine?.label ?? "ยังไม่มีรูปยาในแฟ้ม"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="actions" className="mt-6 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          label="ประวัติความดัน"
          value={String(elderly._count.bloodPressures)}
          description="จำนวนรายการความดันที่บันทึกไว้ในระบบ"
          tone="elderly"
        />
        <SummaryCard
          label="รูปยาและผลสแกน"
          value={`${elderly._count.medicineImages} / ${elderly._count.aiScans}`}
          description="จำนวนรูปยาที่เก็บไว้และจำนวนผลวิเคราะห์จาก AI"
          tone="elderly"
        />
        <SummaryCard
          label="บทสนทนาช่วยเหลือ"
          value={String(elderly._count.chatMessages + elderly._count.aiHealthMessages)}
          description="รวมข้อความที่คุยกับคุณหมอและ AI ในแฟ้มนี้"
          tone="elderly"
        />
      </section>

      <section id="support" className="mt-6 grid items-start gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <CaseRequestPanel
          elderlyId={elderly.id}
          caseStatus={elderly.caseStatus}
          doctorRequestNote={elderly.doctorRequestNote}
          doctorRequestedAt={elderly.doctorRequestedAt?.toISOString()}
          doctorNames={elderly.doctors.map((item) => item.doctor.name)}
        />

        <Card className="border-cyan-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <CardTitle>ศูนย์ช่วยเหลือ</CardTitle>
              <CardDescription>
                ใช้ปุ่มลอยมุมขวาล่างเพื่อเปิดแชท AI หรือทักหาคุณหมอได้ทันทีโดยไม่ทำให้หน้าหลักรก
              </CardDescription>
            </div>
            <div className="rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-slate-700">
              แตะปุ่มลอยเพื่อเปิดแชท
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.7rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                AI สุขภาพ
              </div>
              <p className="mt-4 text-lg font-black tracking-tight text-slate-950">
                ถามได้ตลอดเวลา
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                เหมาะกับการถามเรื่องยา ความดัน และขอให้ระบบสรุปข้อมูลล่าสุดให้แบบเข้าใจง่าย
              </p>
              <div className="mt-4 rounded-[1.3rem] bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  คำตอบล่าสุด
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {summarizeText(latestAiHealthMessage?.content) ??
                    "ยังไม่มีบทสนทนากับ AI ในตอนนี้"}
                </p>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                ติดต่อคุณหมอ
              </div>
              <p className="mt-4 text-lg font-black tracking-tight text-slate-950">
                ทักง่าย ไม่ต้องเลื่อนหาห้องแชท
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                ถ้าต้องการส่งอาการหรือขอให้คุณหมอช่วยดูผลตรวจ ใช้ปุ่มลอยเพื่อเปิดห้องแชทได้ทันที
              </p>
              <div className="mt-4 rounded-[1.3rem] bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  ข้อความล่าสุด
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {summarizeText(latestDoctorMessage?.content) ??
                    (latestDoctor
                      ? `คุณหมอที่ดูแลอยู่คือ ${latestDoctor.name}`
                      : "ยังไม่มีข้อความจากคุณหมอในตอนนี้")}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="scan" className="mt-6 grid items-start gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <AiScanForm elderlyId={elderly.id} />
        <MedicineUploadForm elderlyId={elderly.id} />
      </section>

      <section id="blood-pressure" className="mt-6 grid items-start gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <BloodPressureForm elderlyId={elderly.id} />

        <Card className="border-emerald-100 bg-[linear-gradient(135deg,rgba(240,253,244,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>แนวทางดูแลวันนี้</CardTitle>
          <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
            <p>1. ถ้าจะวัดความดัน ควรนั่งพักก่อนประมาณ 5 นาทีแล้วค่อยวัด</p>
            <p>2. ถ้ามีรูปจากเครื่องวัดอยู่แล้ว สามารถใช้สแกนจากรูปหรือกรอกเองได้ตามสะดวก</p>
            <p>3. ถ้าระบบสรุปว่าเริ่มสูงหรือผิดปกติ ให้ใช้ปุ่มลอยทัก AI หรือคุณหมอต่อได้ทันที</p>
            <p>4. หากต้องการดูย้อนหลังทั้งหมด กดเปิดแฟ้มสุขภาพด้านบนเพื่อดูประวัติเต็ม</p>
          </div>
        </Card>
      </section>

      <section id="history" className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>บันทึกล่าสุดในแฟ้ม</CardTitle>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                ค่าความดันล่าสุด
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {latestBloodPressure
                  ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic} mmHg วัดเมื่อ ${formatDate(latestBloodPressure.measuredAt)}`
                  : "ยังไม่มีการบันทึกความดันในแฟ้ม"}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                ผล AI ล่าสุด
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {latestAiScan?.summary ?? "ยังไม่มีผลวิเคราะห์ล่าสุด"}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                รูปยาล่าสุด
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {latestMedicine?.label ?? "ยังไม่มีรูปยาในแฟ้ม"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(248,250,252,0.96)_100%)]">
          <CardTitle>แฟ้มสุขภาพย้อนหลัง</CardTitle>
          <CardDescription className="mt-2">
            ถ้าต้องการดูประวัติเต็มแบบเรียงตามเวลา เปิดแฟ้มสุขภาพเพื่อดูรูปยา ค่าความดัน และข้อความในเคสทั้งหมด
          </CardDescription>
          <div className="mt-6 space-y-4">
            <Link
              href={`/elderly/${elderly.id}`}
              className="inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-[1.45rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-3 text-base font-bold text-emerald-900 shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-[linear-gradient(135deg,rgba(209,250,229,0.98)_0%,rgba(255,255,255,0.98)_100%)]"
            >
              เปิดแฟ้มสุขภาพเต็ม
            </Link>
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
              คุณสามารถเปิดดูประวัติย้อนหลังทั้งหมดได้จากแฟ้มเดียว ไม่ว่าจะเป็นรูปยา ผล AI
              ความดัน หรือสรุปการพูดคุยที่ผ่านมา
            </div>
          </div>
        </Card>
      </section>

      <FloatingSupportDock
        items={[
          {
            id: "ai-health",
            label: "คุยกับ AI",
            description: "ถามเรื่องยา ความดัน และสรุปข้อมูลสุขภาพ",
            icon: "ai",
            content: (
              <AiHealthChatPanel
                elderlyId={elderly.id}
                messages={elderly.aiHealthMessages.map((message) => ({
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  createdAt: message.createdAt.toISOString(),
                }))}
              />
            ),
          },
          {
            id: "doctor-chat",
            label: "ติดต่อหมอ",
            description: "ส่งอาการหรือผลตรวจให้คุณหมอดูได้ทันที",
            icon: "doctor",
            content: (
              <ChatPanel
                elderlyId={elderly.id}
                currentUserId={session.user.id}
                title="ส่งข้อความถึงคุณหมอ"
                description="หากต้องการให้คุณหมอช่วยดูผลตรวจหรืออาการเพิ่มเติม สามารถส่งข้อความได้จากหน้าต่างนี้ทันที"
                emptyMessage="ยังไม่มีข้อความถึงคุณหมอ เริ่มพิมพ์อาการหรือสิ่งที่อยากให้ช่วยดูได้เลย"
                placeholder="เช่น วันนี้มีอาการเวียนหัวหลังวัดความดัน / อยากให้ช่วยดูรูปยาที่เพิ่งอัปโหลด"
                notice={
                  elderly.doctors.length
                    ? `ตอนนี้มีคุณหมอดูแลอยู่: ${elderly.doctors.map((item) => item.doctor.name).join(", ")}`
                    : "หากยังไม่มีคุณหมอรับเคส ข้อความล่าสุดของคุณจะถูกนำขึ้นคิวให้คุณหมอเห็นก่อนรับเคส"
                }
                messages={elderly.chatMessages.map((message) => ({
                  id: message.id,
                  content: message.content,
                  createdAt: message.createdAt.toISOString(),
                  senderId: message.sender.id,
                  senderName: message.sender.name,
                  senderRole: message.sender.role,
                }))}
              />
            ),
          },
        ]}
      />
    </AppShell>
  );
}
