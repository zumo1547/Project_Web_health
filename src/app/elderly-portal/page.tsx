import { auth } from "@/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { AiHealthChatPanel } from "@/components/forms/ai-health-chat-panel";
import { AiScanForm } from "@/components/forms/ai-scan-form";
import { BloodPressureForm } from "@/components/forms/blood-pressure-form";
import { CaseRequestPanel } from "@/components/forms/case-request-panel";
import { ChatPanel } from "@/components/forms/chat-panel";
import { MedicineUploadForm } from "@/components/forms/medicine-upload-form";
import { Card, CardTitle } from "@/components/ui/card";
import { DoctorCaseStatus } from "@/generated/prisma";
import { ensureElderlyProfileForUser } from "@/lib/elderly-profile";
import { getBloodPressureAssessment } from "@/lib/health-presenters";
import { canAccessElderlyPortal } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

  return (
    <AppShell
      portal="elderly"
      title={`ตรวจสุขภาพวันนี้: ${elderly.firstName}`}
      subtitle="เช็กค่าความดัน สแกนยา บันทึกอาการ ดูสรุปสุขภาพ และส่งต่อให้คุณหมอช่วยดูได้จากหน้าเดียว"
      user={session.user}
      actions={
        <Link
          href={`/elderly/${elderly.id}`}
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] bg-emerald-700 px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-800"
        >
          เปิดแฟ้มสุขภาพ
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          label="ผลประเมินสุขภาพ"
          value={bloodPressureAssessment.shortLabel}
          description={bloodPressureAssessment.guidance}
          tone={bloodPressureAssessment.tone === "rose" ? "alert" : "elderly"}
        />
        <SummaryCard
          label="รูปยา / ผล AI"
          value={`${elderly._count.medicineImages} / ${elderly._count.aiScans}`}
          description="จำนวนรูปยาและจำนวนผลวิเคราะห์ที่ถูกบันทึกไว้ในแฟ้มสุขภาพ"
          tone="elderly"
        />
        <SummaryCard
          label="คุณหมอที่ติดตาม"
          value={elderly.doctors.length ? elderly.doctors[0].doctor.name : "ยังไม่มี"}
          description={
            elderly.doctors.length
              ? elderly.doctors.map((item) => item.doctor.email).join(", ")
              : "หากต้องการให้คุณหมอช่วยดูข้อมูลสุขภาพ สามารถทักแชทหรือกดขอรับเคสได้"
          }
          tone="elderly"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.95)_100%)]">
          <CardTitle>เริ่มตรวจสุขภาพ 3 ขั้นตอน</CardTitle>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.6rem] bg-white/85 p-5">
              <p className="text-base font-extrabold text-slate-950">1. เลือกสิ่งที่อยากตรวจ</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                เลือกตรวจความดัน สแกนยา หรือบันทึกอาการจากหน้านี้ได้ทันที
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/85 p-5">
              <p className="text-base font-extrabold text-slate-950">2. ระบบสรุปและบันทึกให้</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                ข้อมูลที่กรอก รูปยา และผล AI จะถูกเก็บรวมไว้ในแฟ้มสุขภาพส่วนตัวอัตโนมัติ
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/85 p-5">
              <p className="text-base font-extrabold text-slate-950">3. ขอคำแนะนำต่อได้</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                ถาม AI ต่อ หรือส่งข้อความให้คุณหมอช่วยดูข้อมูลสุขภาพในเคสเดียวกันได้
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.95)_100%)]">
          <CardTitle>สรุปสุขภาพล่าสุด</CardTitle>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] bg-white/85 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ผล AI ล่าสุด
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {latestAiScan?.summary ?? "ยังไม่มีผลวิเคราะห์จาก AI"}
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/85 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ยาที่บันทึกล่าสุด
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {latestMedicine?.label ?? "ยังไม่มีรูปยาที่อัปโหลด"}
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/85 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                แชทถึงคุณหมอ
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {elderly._count.chatMessages > 0
                  ? `มีข้อความในเคสแล้ว ${elderly._count.chatMessages} ข้อความ`
                  : "ยังไม่มีข้อความถึงคุณหมอ"}
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/85 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ประวัติถาม AI
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {elderly._count.aiHealthMessages > 0
                  ? `ถาม AI แล้ว ${elderly._count.aiHealthMessages} ข้อความ`
                  : "ยังไม่มีประวัติถาม AI"}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickActionCard
          href="#scan"
          eyebrow="ตรวจจากรูป"
          title="สแกนยา"
          description="ถ่ายรูปหรืออัปโหลดรูปยา แล้วให้ AI ช่วยบอกว่านี่คือยาอะไรและมักใช้ทำอะไร"
          tone="elderly"
        />
        <QuickActionCard
          href="#blood-pressure"
          eyebrow="ตรวจค่าประจำวัน"
          title="ตรวจความดัน"
          description="สแกนรูปจากเครื่องวัดหรือกรอกค่าด้วยตัวเอง พร้อมให้ระบบช่วยประเมินเบื้องต้น"
          tone="elderly"
        />
        <QuickActionCard
          href={`/elderly/${elderly.id}`}
          eyebrow="แฟ้มสุขภาพ"
          title="ดูแฟ้มย้อนหลัง"
          description="เปิดประวัติสุขภาพย้อนหลังทั้งหมด สถิติสะสม และข้อมูลส่วนตัวที่ตั้งค่าไว้"
          tone="elderly"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <CaseRequestPanel
            elderlyId={elderly.id}
            caseStatus={elderly.caseStatus}
            doctorRequestNote={elderly.doctorRequestNote}
            doctorRequestedAt={elderly.doctorRequestedAt?.toISOString()}
            doctorNames={elderly.doctors.map((item) => item.doctor.name)}
          />

          <div id="doctor-chat">
            <ChatPanel
              elderlyId={elderly.id}
              currentUserId={session.user.id}
              title="ส่งข้อความถึงคุณหมอ"
              description="หากต้องการให้คุณหมอช่วยดูผลตรวจหรืออาการเพิ่มเติม สามารถส่งข้อความได้ตลอด 24 ชั่วโมง"
              emptyMessage="ยังไม่มีข้อความถึงคุณหมอ เริ่มทักเพื่อแจ้งอาการ สอบถามเรื่องยา หรือขอให้ช่วยดูค่าความดันได้เลย"
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
          </div>
        </div>

        <AiHealthChatPanel
          elderlyId={elderly.id}
          messages={elderly.aiHealthMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
          }))}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div id="scan" className="space-y-6">
          <AiScanForm elderlyId={elderly.id} />
          <MedicineUploadForm elderlyId={elderly.id} />
        </div>

        <div id="blood-pressure" className="space-y-6">
          <BloodPressureForm elderlyId={elderly.id} />

          <Card className="border border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(240,253,244,0.95)_100%)]">
            <CardTitle>คำแนะนำการตรวจวันนี้</CardTitle>
            <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
              <p>1. หากจะสแกนยา ควรถ่ายให้เห็นชื่อยาและขนาดยาให้ชัด</p>
              <p>2. หากจะตรวจความดัน ควรนั่งพักก่อนวัดและบันทึกเวลาไว้เสมอ</p>
              <p>3. หากมีอาการผิดปกติร่วมด้วย ให้พิมพ์ในแชทถึงคุณหมอทันที</p>
              <p>4. ต้องการดูประวัติย้อนหลังทั้งหมด สามารถกดเข้าแฟ้มสุขภาพได้ตลอดเวลา</p>
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
