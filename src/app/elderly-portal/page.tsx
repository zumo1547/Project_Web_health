import { auth } from "@/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { DoctorAppointmentList } from "@/components/dashboard/doctor-appointment-list";
import { ElderlyAppointmentHistory } from "@/components/dashboard/elderly-appointment-history";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { AiHealthChatPanel } from "@/components/forms/ai-health-chat-panel";
import { AiScanForm } from "@/components/forms/ai-scan-form";
import { BloodPressureForm } from "@/components/forms/blood-pressure-form";
import { CaseRequestPanel } from "@/components/forms/case-request-panel";
import { ChatPanel } from "@/components/forms/chat-panel";
import { ElderlyAppointmentPanel } from "@/components/forms/elderly-appointment-panel";
import { MedicineUploadForm } from "@/components/forms/medicine-upload-form";
import { NearbyHospitalsPanel } from "@/components/forms/nearby-hospitals-panel";
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

  if (session.user.onboardingRequired) {
    redirect("/complete-profile");
  }

  const ensuredProfile = await ensureElderlyProfileForUser(session.user.id);

  if (ensuredProfile.onboardingRequired) {
    redirect("/complete-profile");
  }

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
  const doctorMessageCount = elderly.chatMessages.filter(
    (message) => message.senderRole === Role.DOCTOR
  ).length;
  const latestAiHealthMessage = [...elderly.aiHealthMessages]
    .reverse()
    .find((message) => message.role === "ASSISTANT");

  return (
    <AppShell
      portal="elderly"
      title={`สุขภาพของ ${elderly.firstName}`}
      subtitle="เริ่มจาก 3 อย่างหลักก่อน คือ สแกนยา บันทึกความดัน และขอความช่วยเหลือ ส่วนประวัติย้อนหลังและโรงพยาบาลใกล้ฉันอยู่ด้านล่าง"
      user={session.user}
      navigation={[
        { href: "#today", label: "วันนี้", eyebrow: "Today" },
        { href: "#help", label: "ขอความช่วยเหลือ", eyebrow: "Help" },
        { href: "#medicine", label: "เรื่องยา", eyebrow: "Medicine" },
        { href: "#pressure", label: "ความดัน", eyebrow: "Pressure" },
        { href: "#appointments", label: "การนัดหมาย", eyebrow: "Appointments" },
        { href: "#history", label: "ย้อนหลัง", eyebrow: "History" },
        { href: "#map", label: "แผนที่", eyebrow: "Map" },
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
      <section id="today" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98)_0%,rgba(240,253,244,0.96)_100%)]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              เริ่มจากตรงนี้
            </div>

            <CardTitle>ทำ 3 อย่างนี้ก่อนในแต่ละวัน</CardTitle>
            <CardDescription>
              ถ้าต้องการใช้งานแบบง่าย ให้กดตามลำดับนี้ก่อน ระบบจะช่วยให้ดูยา ค่าความดัน
              และขอความช่วยเหลือได้โดยไม่ต้องหาปุ่มหลายรอบ
            </CardDescription>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link
              href="#medicine"
              className="rounded-[1.85rem] border border-white/80 bg-white/92 px-5 py-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.24)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ขั้นที่ 1
              </p>
              <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
                สแกนยา
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                ถ่ายรูปหรือเลือกรูปยา แล้วให้ AI ช่วยบอกว่ายานี้คืออะไร
              </p>
            </Link>

            <Link
              href="#pressure"
              className="rounded-[1.85rem] border border-white/80 bg-white/92 px-5 py-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.24)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ขั้นที่ 2
              </p>
              <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
                วัดความดัน
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                กรอกค่าด้วยตัวเองหรือใช้รูปจากเครื่องวัดให้ระบบช่วยประเมิน
              </p>
            </Link>

            <Link
              href="#help"
              className="rounded-[1.85rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(15,118,110,0.95)_0%,rgba(5,150,105,0.92)_100%)] px-5 py-5 text-white shadow-[0_24px_52px_-34px_rgba(5,150,105,0.55)] transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:bg-[linear-gradient(135deg,rgba(13,148,136,0.96)_0%,rgba(5,150,105,0.94)_100%)]"
            >
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-50">
                ขั้นที่ 3
              </p>
              <p className="mt-3 text-xl font-black tracking-tight text-white">
                ขอความช่วยเหลือ
              </p>
              <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                ถ้ามีอาการผิดปกติหรืออยากถามเพิ่ม ให้คุยกับ AI หรือคุณหมอได้ทันที
              </p>
            </Link>
          </div>
        </Card>

        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <SummaryCard
              label="ความดันล่าสุด"
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
            <CardTitle>คำแนะนำการใช้งาน</CardTitle>
            <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
              <p>1. นั่งพักก่อนวัดประมาณ 5 นาที แล้วค่อยบันทึกค่า</p>
              <p>2. ถ้ามีรูปจากเครื่องวัดอยู่แล้ว ใช้ส่วนสแกนรูปความดันให้ระบบช่วยอ่านค่าได้</p>
              <p>3. ถ้าผลประเมินบอกว่าเริ่มสูงหรือผิดปกติ ให้กดปุ่มลอยทัก AI หรือคุณหมอได้ทันที</p>
              <p>4. ถ้ารู้สึกไม่สบายมาก ให้เลื่อนลงไปดูโรงพยาบาลใกล้ฉันในหมวดย้อนหลังได้ด้านล่าง</p>
            </div>
          </Card>
        </div>
      </section>

      <section id="help" className="mt-6 grid items-start gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <CaseRequestPanel
          elderlyId={elderly.id}
          caseStatus={elderly.caseStatus}
          doctorRequestNote={elderly.doctorRequestNote}
          doctorRequestedAt={elderly.doctorRequestedAt?.toISOString()}
          doctorNames={elderly.doctors.map((item) => item.doctor.name)}
        />

        <Card className="border-cyan-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>ขอความช่วยเหลือได้ 2 แบบ</CardTitle>
          <CardDescription className="mt-2">
            ใช้ปุ่มลอยมุมขวาล่างเมื่ออยากถามเรื่องยา ความดัน หรือส่งอาการให้คุณหมอดู
          </CardDescription>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.7rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                ผู้ช่วย AI
              </div>
              <p className="mt-4 text-lg font-black tracking-tight text-slate-950">
                ถามเรื่องยาและความดัน
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                เหมาะกับคำถามทั่วไป เช่น ยานี้ใช้ทำอะไร ความดันระดับนี้ควรระวังไหม หรือให้ช่วยสรุปข้อมูลสุขภาพล่าสุด
              </p>
              <div className="mt-4 rounded-[1.3rem] bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  คำตอบล่าสุด
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {summarizeText(latestAiHealthMessage?.content) ??
                    "ยังไม่มีการพูดคุยกับ AI ในตอนนี้"}
                </p>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                ห้องแชทกับหมอ
              </div>
              <p className="mt-4 text-lg font-black tracking-tight text-slate-950">
                ส่งอาการให้คุณหมอดู
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                ใช้เมื่อมีอาการผิดปกติ อยากส่งผลตรวจให้คุณหมอช่วยดู หรืออยากให้คุณหมอแนะนำต่อทันที
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

      <section id="medicine" className="mt-6 grid gap-5">
        <Card className="border-sky-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>หมวดเรื่องยา</CardTitle>
          <CardDescription className="mt-2">
            ถ้าต้องการให้ระบบช่วยดูว่ายาคืออะไร ให้เริ่มจากสแกนยา ถ้าแค่อยากเก็บรูปยาไว้ก่อนให้ใช้บันทึกรูปยา
          </CardDescription>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
          <AiScanForm elderlyId={elderly.id} showBloodPressure={false} />
          <MedicineUploadForm elderlyId={elderly.id} />
        </div>
      </section>

      <section id="pressure" className="mt-6 grid gap-5">
        <Card className="border-emerald-100 bg-[linear-gradient(135deg,rgba(240,253,244,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>หมวดความดัน</CardTitle>
          <CardDescription className="mt-2">
            ใช้ส่วนนี้เมื่อวัดความดันแล้ว ต้องการบันทึกค่า ดูผลประเมิน หรือดูแนวทางดูแลเบื้องต้น
          </CardDescription>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
          <AiScanForm elderlyId={elderly.id} showMedicine={false} />
          <BloodPressureForm elderlyId={elderly.id} />
        </div>
      </section>

      <section id="appointments" className="mt-6 grid gap-5">
        <ElderlyAppointmentPanel elderlyId={elderly.id} />
      </section>

      <section id="history" className="mt-6 grid gap-5 xl:grid-cols-2 xl:items-start">
        <Card className="border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>บันทึกล่าสุดในแฟ้ม</CardTitle>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                ความดันล่าสุด
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
          <CardTitle>ดูย้อนหลังทั้งหมด</CardTitle>
          <CardDescription className="mt-2">
            ถ้าต้องการดูประวัติเต็มแบบเรียงตามเวลา เปิดแฟ้มสุขภาพเพื่อดูรูปยา ความดัน และข้อความทั้งหมดในที่เดียว
          </CardDescription>
          <div className="mt-6 space-y-4">
            <Link
              href={`/elderly/${elderly.id}`}
              className="inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-[1.45rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-3 text-base font-bold text-emerald-900 shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-[linear-gradient(135deg,rgba(209,250,229,0.98)_0%,rgba(255,255,255,0.98)_100%)]"
            >
              เปิดแฟ้มสุขภาพเต็ม
            </Link>
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
              คุณสามารถเปิดดูประวัติย้อนหลังทั้งหมดได้จากแฟ้มเดียว ไม่ว่าจะเป็นรูปยา ผล AI ความดัน หรือสรุปการพูดคุยที่ผ่านมา
            </div>
          </div>
        </Card>
      </section>

      <section id="map" className="mt-6">
        <NearbyHospitalsPanel
          elderlyId={elderly.id}
          profileName={elderly.firstName}
          savedLocation={{
            latitude: elderly.lastKnownLatitude,
            longitude: elderly.lastKnownLongitude,
            label: elderly.lastKnownLocationLabel,
            updatedAt: elderly.lastKnownLocationUpdatedAt?.toISOString() ?? null,
          }}
        />
      </section>

      <FloatingSupportDock
        items={[
          {
            id: "ai-health",
            label: "ถาม AI",
            description: "เรื่องยา ความดัน และสรุปสุขภาพ",
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
            label: `ติดต่อหมอ${doctorMessageCount > 0 ? ` (${doctorMessageCount})` : ""}`,
            description: "ส่งอาการหรือผลตรวจให้คุณหมอดู",
            icon: "doctor",
            content: (
              <ChatPanel
                elderlyId={elderly.id}
                currentUserId={session.user.id}
                title="ส่งข้อความถึงคุณหมอ"
                description="หากต้องการให้คุณหมอช่วยดูผลตรวจหรืออาการเพิ่มเติม สามารถส่งข้อความได้จากหน้าต่างนี้ทันที"
                emptyMessage="ยังไม่มีข้อความถึงคุณหมอ เริ่มพิมพ์อาการหรือสิ่งที่อยากให้ช่วยดูได้เลย"
                placeholder="เช่น วันนี้มีอาการเวียนหัวหลังวัดความดัน / อยากให้ช่วยดูรูปยาที่เพิ่งอัปโหลด"
                hasActiveDoctor={elderly.doctors.length > 0}
                notice={
                  elderly.doctors.length
                    ? `✅ ตอนนี้มีคุณหมอดูแลอยู่: ${elderly.doctors.map((item) => item.doctor.name).join(", ")}`
                    : "📧 ส่งคำขอให้คุณหมอรับเคส ด้านบนแล้วคุณหมอจะได้รับการแจ้งเตือน"
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
