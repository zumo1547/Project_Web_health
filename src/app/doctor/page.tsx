import { auth } from "@/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { DoctorAppointmentList } from "@/components/dashboard/doctor-appointment-list";
import { DoctorCaseActionButton } from "@/components/dashboard/doctor-case-action-button";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Badge } from "@/components/ui/badge";
import { AutoRefresh } from "@/components/ui/auto-refresh";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CaseStatus, DoctorCaseStatus, Role } from "@/generated/prisma";
import { formatSystemDateTime } from "@/lib/date-time";
import { getBloodPressureAssessment } from "@/lib/health-presenters";
import { canAccessDoctorPortal } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

function formatDate(date: Date) {
  return formatSystemDateTime(date);
}

function summarizeText(value?: string | null) {
  if (!value) return null;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137)}...`;
}

export default async function DoctorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/doctor-login");
  }

  if (!canAccessDoctorPortal(session.user.role)) {
    redirect("/elderly-portal");
  }

  const [activeCases, waitingCases] = await Promise.all([
    prisma.doctorPatient.findMany({
      where:
        session.user.role === Role.ADMIN
          ? { status: DoctorCaseStatus.ACTIVE }
          : {
              doctorId: session.user.id,
              status: DoctorCaseStatus.ACTIVE,
            },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        elderly: {
          include: {
            bloodPressures: {
              orderBy: {
                measuredAt: "desc",
              },
              take: 1,
            },
            aiScans: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            chatMessages: {
              where: {
                senderRole: Role.ELDERLY,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            elderlyUser: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.elderlyProfile.findMany({
      where: {
        caseStatus: CaseStatus.WAITING_DOCTOR,
        ...(session.user.role === Role.DOCTOR
          ? {
              doctors: {
                none: {
                  doctorId: session.user.id,
                  status: DoctorCaseStatus.ACTIVE,
                },
              },
            }
          : {}),
      },
      include: {
        bloodPressures: {
          orderBy: {
            measuredAt: "desc",
          },
          take: 1,
        },
        aiScans: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        chatMessages: {
          where: {
            senderRole: Role.ELDERLY,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        elderlyUser: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        doctorRequestedAt: "desc",
      },
    }),
  ]);

  const highRiskCases = activeCases.filter((item) => {
    const assessment = getBloodPressureAssessment(
      item.elderly.bloodPressures[0]?.systolic,
      item.elderly.bloodPressures[0]?.diastolic,
    );
    return assessment.tone === "rose";
  }).length;

  const latestWaitingCase = waitingCases[0];
  const latestActiveCase = activeCases[0];
  const totalUnreadSummaries =
    waitingCases.filter((item) => item.chatMessages[0]).length +
    activeCases.filter((item) => item.elderly.chatMessages[0]).length;

  return (
    <AppShell
      portal="doctor"
      title="ศูนย์ติดตามเคสคุณหมอ"
      subtitle="ดูคิวที่รอรับเคส เปิดแฟ้มผู้สูงอายุ อ่านสรุปล่าสุดจากแชทและผลสุขภาพ แล้วสลับดูแลหลายเคสได้จากหน้าที่จัดเรียงให้กดง่ายขึ้น"
      user={session.user}
      navigation={[
        { href: "#overview", label: "ภาพรวมวันนี้", eyebrow: "Today" },
        { href: "#appointments", label: "การนัดหมาย", eyebrow: "Appointments" },
        { href: "#queue", label: "คิวรอรับเคส", eyebrow: "Queue" },
        { href: "#active", label: "เคสที่กำลังดูแล", eyebrow: "Active" },
      ]}
      actions={
        <Link
          href="#queue"
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.45rem] border border-cyan-300/35 bg-[linear-gradient(135deg,rgba(34,211,238,0.26)_0%,rgba(14,165,233,0.22)_52%,rgba(15,23,42,0.14)_100%)] px-5 py-3 text-base font-bold text-white shadow-[0_20px_38px_-26px_rgba(6,182,212,0.55)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.34)_0%,rgba(14,165,233,0.3)_52%,rgba(15,23,42,0.18)_100%)]"
        >
          เปิดคิวล่าสุด
        </Link>
      }
    >
      <AutoRefresh intervalMs={5000} />

      <section id="overview" className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <Card className="overflow-hidden border-cyan-100 bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(15,118,110,0.95)_100%)] text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                ห้องควบคุมงานวันนี้
              </div>
              <CardTitle className="text-white">ดูคิว อ่านสรุป และเปิดแฟ้มได้จากจุดเดียว</CardTitle>
              <CardDescription className="text-slate-200">
                หน้านี้ถูกจัดให้คุณหมอเริ่มงานได้เร็วขึ้น โดยวางคิวรอรับเคสไว้ก่อน ตามด้วยเคสที่กำลังดูแลและข้อมูลสรุปล่าสุดที่ใช้ตัดสินใจก่อนเปิดแฟ้ม
              </CardDescription>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-white/10 px-4 py-4 text-sm leading-7 text-slate-100">
              <p className="font-bold text-white">สถานะตอนนี้</p>
              <p className="mt-2">
                {latestWaitingCase
                  ? `มีเคสรอคุณหมอเปิดอ่านล่าสุดเมื่อ ${formatDate(latestWaitingCase.doctorRequestedAt ?? latestWaitingCase.updatedAt)}`
                  : "ตอนนี้ไม่มีเคสรอรับใหม่ในคิว"}
              </p>
              <p className="mt-1">
                {latestActiveCase
                  ? `เคสที่เปิดดูแลล่าสุดคือ ${latestActiveCase.elderly.firstName} ${latestActiveCase.elderly.lastName}`
                  : "ยังไม่มีเคสที่กำลังดูแลอยู่ตอนนี้"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <QuickActionCard
              href="#queue"
              eyebrow="Step 1"
              title="อ่านคิวรอรับเคส"
              description="อ่านข้อความย่อและข้อมูลความดันล่าสุดก่อนตัดสินใจรับเคส"
              tone="doctor"
            />
            <QuickActionCard
              href="#active"
              eyebrow="Step 2"
              title="เปิดเคสที่กำลังดูแล"
              description="เข้าแฟ้มสุขภาพและแชทต่อจากรายการเคสที่กำลังติดตาม"
              tone="doctor"
            />
            <QuickActionCard
              href={session.user.role === Role.ADMIN ? "/admin" : "#active"}
              eyebrow="Tools"
              title={session.user.role === Role.ADMIN ? "สลับไปหน้าแอดมิน" : "ดูเคสทั้งหมด"}
              description={
                session.user.role === Role.ADMIN
                  ? "เปิดศูนย์จัดการระบบเพื่อสลับโหมดและจัดการเคสจากมุมมองแอดมิน"
                  : "คุณหมอหนึ่งคนสามารถสลับดูแลหลายเคสได้พร้อมกันจากหน้าเดียว"
              }
              tone="doctor"
            />
          </div>
        </Card>

        <div className="grid gap-4">
          <SummaryCard
            label="คิวรอรับเคส"
            value={String(waitingCases.length)}
            description="ผู้สูงอายุที่กำลังรอให้คุณหมอเปิดอ่านและรับเคสดูแล"
            tone="doctor"
          />
          <SummaryCard
            label="เคสกำลังติดตาม"
            value={String(activeCases.length)}
            description="เคสที่คุณหมอกำลังดูแลและสามารถเปิดแฟ้มต่อได้ทันที"
            tone="doctor"
          />
          <SummaryCard
            label="เคสควรเฝ้าระวัง"
            value={String(highRiskCases)}
            description="ประเมินจากความดันล่าสุดที่อยู่ในช่วงเสี่ยงและควรติดตามต่อ"
            tone={highRiskCases > 0 ? "alert" : "doctor"}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="ข้อความที่ต้องอ่าน"
          value={String(totalUnreadSummaries)}
          description="นับจากข้อความล่าสุดที่มีอยู่ในคิวและในเคสที่คุณกำลังดูแล"
          tone="doctor"
        />
        <SummaryCard
          label="คิวพร้อมเปิดแฟ้ม"
          value={latestWaitingCase ? "มี" : "ว่าง"}
          description={
            latestWaitingCase
              ? `${latestWaitingCase.firstName} ${latestWaitingCase.lastName} ส่งคำขอล่าสุดเข้ามา`
              : "ตอนนี้ไม่มีคำขอใหม่ให้เปิดอ่าน"
          }
          tone="doctor"
        />
        <SummaryCard
          label="เคสติดตามต่อ"
          value={latestActiveCase ? "ต่อได้" : "ไม่มี"}
          description={
            latestActiveCase
              ? `${latestActiveCase.elderly.firstName} ${latestActiveCase.elderly.lastName} ยังเปิดเคสอยู่`
              : "คุณหมอสามารถเริ่มจากการรับคิวใหม่ด้านล่าง"
          }
          tone="doctor"
        />
        <SummaryCard
          label="ทำงานหลายเคส"
          value="พร้อม"
          description="ระบบยังรองรับให้คุณหมอรับหลายเคสพร้อมกันและปิดแยกแต่ละเคสได้"
          tone="doctor"
        />
      </section>

      <section id="appointments" className="mt-6 grid gap-5">
        <Card className="border-purple-100 bg-[linear-gradient(135deg,rgba(250,245,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>🔔 การนัดหมายของคุณหมอ</CardTitle>
          <CardDescription className="mt-2">
            ดูการนัดหมายที่กำลังจะมาถึง วันนี้มีการนัดหรือไม่ และสามารถจัดการการนัดหมายได้
          </CardDescription>
        </Card>

        <DoctorAppointmentList />
      </section>

      <section id="queue" className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <div className="space-y-3">
            <CardTitle>คิวรอรับเคส</CardTitle>
            <CardDescription>
              เริ่มจากการอ่านข้อความที่ผู้สูงอายุส่งเข้ามา ดูค่าความดันและผล AI ล่าสุด แล้วค่อยกดรับเคสหรือเปิดแฟ้มก่อนตัดสินใจ
            </CardDescription>
          </div>

          <div className="mt-5 space-y-4">
            {waitingCases.length === 0 ? (
              <div className="rounded-[1.8rem] border border-white/70 bg-white/85 px-5 py-6 text-base leading-7 text-slate-600">
                ตอนนี้ยังไม่มีคิวรอรับเคสใหม่ คุณหมอสามารถเลื่อนลงไปดูเคสที่กำลังติดตามต่อได้เลย
              </div>
            ) : null}

            {waitingCases.map((item) => {
              const latestBloodPressure = item.bloodPressures[0];
              const latestPatientMessage = item.chatMessages[0];
              const assessment = getBloodPressureAssessment(
                latestBloodPressure?.systolic,
                latestBloodPressure?.diastolic,
              );

              return (
                <div
                  key={item.id}
                  className="rounded-[1.9rem] border border-slate-200 bg-white/92 p-5 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.25)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black tracking-tight text-slate-950">
                          {item.firstName} {item.lastName}
                        </h3>
                        <Badge tone={assessment.tone}>{assessment.shortLabel}</Badge>
                      </div>
                      <p className="text-base text-slate-600">
                        บัญชีผู้สูงอายุ: {item.elderlyUser?.email ?? "ยังไม่ได้เชื่อมบัญชี"}
                      </p>
                      {item.doctorRequestedAt ? (
                        <p className="text-sm text-slate-500">
                          ขอรับเคสเมื่อ {formatDate(item.doctorRequestedAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
                      รอคุณหมอเปิดอ่าน
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ความดันล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {latestBloodPressure
                          ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic} mmHg`
                          : "ยังไม่มีข้อมูลความดัน"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ผล AI ล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {item.aiScans[0]?.summary ?? "ยังไม่มีผลวิเคราะห์จาก AI"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">
                      เรื่องที่ผู้สูงอายุทักเข้ามา
                    </p>
                    <p className="mt-2 text-base leading-7 text-amber-950">
                      {summarizeText(latestPatientMessage?.content) ??
                        summarizeText(item.doctorRequestNote) ??
                        "ยังไม่มีข้อความล่าสุดจากผู้สูงอายุ กรุณาเปิดแฟ้มเพื่อดูข้อมูลก่อนรับเคส"}
                    </p>
                    {latestPatientMessage ? (
                      <p className="mt-2 text-sm text-amber-800">
                        ข้อความล่าสุดเมื่อ {formatDate(latestPatientMessage.createdAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {session.user.role === Role.DOCTOR ? (
                      <DoctorCaseActionButton
                        elderlyId={item.id}
                        action="JOIN_SELF"
                        label="รับเคสนี้"
                      />
                    ) : null}
                    <Link
                      href={`/elderly/${item.id}`}
                      className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] border border-slate-200 px-5 py-3 text-base font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      เปิดแฟ้มก่อนรับเคส
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
            <CardTitle>เครื่องมือสำหรับเริ่มงานเร็ว</CardTitle>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.6rem] bg-white/88 p-4">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  วิธีอ่านคิวแบบเร็ว
                </p>
                <div className="mt-3 space-y-3 text-base leading-8 text-slate-700">
                  <p>1. ดูข้อความย่อของผู้สูงอายุเพื่อรู้ว่าเขาทักมาด้วยเรื่องอะไร</p>
                  <p>2. ดูความดันล่าสุดและผล AI เพื่อคัดเคสที่ควรรีบเปิดแฟ้มก่อน</p>
                  <p>3. ถ้าพร้อมดูแลต่อ ให้กดรับเคส หรือเปิดแฟ้มก่อนแล้วค่อยตัดสินใจ</p>
                </div>
              </div>

              <div className="rounded-[1.6rem] bg-slate-950 px-5 py-5 text-white">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">
                  จุดที่ควรดูต่อทันที
                </p>
                <p className="mt-3 text-xl font-black tracking-tight">
                  {latestWaitingCase
                    ? `${latestWaitingCase.firstName} ${latestWaitingCase.lastName}`
                    : "ไม่มีเคสรอใหม่"}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {latestWaitingCase
                    ? summarizeText(
                        latestWaitingCase.chatMessages[0]?.content ??
                          latestWaitingCase.doctorRequestNote,
                      ) ?? "เปิดแฟ้มเพื่อดูข้อมูลล่าสุดเพิ่มเติม"
                    : "ถ้าคิวว่าง ลองไล่ดูเคสที่กำลังติดตามด้านล่างต่อได้เลย"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,250,252,0.96)_100%)]">
            <CardTitle>ภาพรวมการสลับดูแลหลายเคส</CardTitle>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">คิวที่พร้อมรับ</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {waitingCases.length}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">กำลังติดตาม</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {activeCases.length}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">ต้องเฝ้าระวัง</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-rose-600">
                  {highRiskCases}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="active" className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <div className="space-y-3">
            <CardTitle>เคสที่กำลังดูแล</CardTitle>
            <CardDescription>
              เคสที่รับแล้วจะถูกรวมไว้ตรงนี้เพื่อให้เปิดแฟ้มและแชทต่อได้รวดเร็ว พร้อมมีสรุปล่าสุดก่อนกดเข้าไป
            </CardDescription>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.6rem] bg-white/88 p-4">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                เคสล่าสุดที่เปิดดูแล
              </p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-950">
                {latestActiveCase
                  ? `${latestActiveCase.elderly.firstName} ${latestActiveCase.elderly.lastName}`
                  : "ยังไม่มี"}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {latestActiveCase
                  ? `เปิดดูแลเมื่อ ${formatDate(latestActiveCase.createdAt)}`
                  : "รับเคสใหม่จากคิวด้านบนแล้วรายการจะมาแสดงที่นี่"}
              </p>
            </div>

            <div className="rounded-[1.6rem] bg-white/88 p-4">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                ความพร้อมตอบกลับ
              </p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-950">
                {activeCases.length > 0 ? "พร้อม" : "ว่าง"}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                แต่ละเคสจะมีปุ่มเปิดแฟ้มและแชทเพื่อคุยต่อจากหน้าคุณหมอได้ทันที
              </p>
            </div>

            <div className="rounded-[1.6rem] bg-slate-950 px-4 py-4 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">
                เวิร์กโฟลว์
              </p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                <p>รับเคส</p>
                <p>เปิดแฟ้ม</p>
                <p>คุยและติดตาม</p>
                <p>เสร็จสิ้นเคส</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(239,246,255,0.94)_100%)]">
          <div className="space-y-3">
            <CardTitle>รายการเคสที่กำลังติดตาม</CardTitle>
            <CardDescription>
              ดูสรุปความดัน ผล AI และข้อความล่าสุดก่อนกดเปิดแฟ้ม เพื่อให้สลับดูแลหลายเคสได้อย่างไม่หลงบริบท
            </CardDescription>
          </div>

          <div className="mt-5 space-y-4">
            {activeCases.length === 0 ? (
              <div className="rounded-[1.8rem] border border-white/70 bg-white/90 px-5 py-6 text-base leading-7 text-slate-600">
                ยังไม่มีเคสที่กำลังดูแลอยู่ คุณหมอสามารถเริ่มจากการรับคิวด้านบนได้ทันที
              </div>
            ) : null}

            {activeCases.map((item) => {
              const latestBloodPressure = item.elderly.bloodPressures[0];
              const latestPatientMessage = item.elderly.chatMessages[0];
              const assessment = getBloodPressureAssessment(
                latestBloodPressure?.systolic,
                latestBloodPressure?.diastolic,
              );

              return (
                <div
                  key={item.id}
                  className="rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black tracking-tight text-slate-950">
                          {item.elderly.firstName} {item.elderly.lastName}
                        </h3>
                        <Badge tone={assessment.tone}>{assessment.shortLabel}</Badge>
                      </div>
                      <p className="text-base text-slate-600">
                        บัญชีผู้สูงอายุ: {item.elderly.elderlyUser?.email ?? "ยังไม่ได้เชื่อมบัญชี"}
                      </p>
                      <p className="text-sm text-slate-500">
                        เปิดดูแลเมื่อ {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                      กำลังติดตาม
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ความดันล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {latestBloodPressure
                          ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic} mmHg`
                          : "ยังไม่มีข้อมูล"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ผล AI ล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {item.elderly.aiScans[0]?.summary ?? "ยังไม่มีผลวิเคราะห์"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ข้อความล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {summarizeText(latestPatientMessage?.content) ?? "ยังไม่มีข้อความใหม่"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-900">
                      สรุปก่อนเข้าแฟ้มและแชท
                    </p>
                    <p className="mt-2 text-base leading-7 text-emerald-950">
                      {summarizeText(latestPatientMessage?.content) ??
                        "หากยังไม่มีข้อความใหม่ คุณหมอสามารถเปิดแฟ้มเพื่อดูประวัติสุขภาพและติดตามค่าที่บันทึกไว้ต่อได้"}
                    </p>
                    {latestPatientMessage ? (
                      <p className="mt-2 text-sm text-emerald-800">
                        ข้อความล่าสุดเมื่อ {formatDate(latestPatientMessage.createdAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/elderly/${item.elderly.id}`}
                      className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] bg-emerald-700 px-5 py-3 text-base font-bold text-white shadow-[0_20px_40px_-24px_rgba(4,120,87,0.7)] transition hover:bg-emerald-800"
                    >
                      เปิดแฟ้มและแชท
                    </Link>
                    {session.user.role === Role.DOCTOR ? (
                      <DoctorCaseActionButton
                        elderlyId={item.elderly.id}
                        action="COMPLETE_SELF"
                        label="เสร็จสิ้นเคส"
                        variant="secondary"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
