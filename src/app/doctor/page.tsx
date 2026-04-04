import { auth } from "@/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { DoctorCaseActionButton } from "@/components/dashboard/doctor-case-action-button";
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

  return (
    <AppShell
      portal="doctor"
      title="หน้าคุณหมอ"
      subtitle="ดูคิวรอรับเคส เปิดแฟ้มย้อนหลัง อ่านข้อความที่ผู้สูงอายุทักมา และสลับดูแลหลายเคสพร้อมกันได้อย่างเป็นระเบียบ"
      user={session.user}
    >
      <AutoRefresh intervalMs={5000} />

      <Card className="mb-6 border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(248,250,252,0.96)_100%)]">
        <div className="space-y-3">
          <CardTitle>ภาพรวมการทำงานของคุณหมอ</CardTitle>
          <CardDescription>
            ระบบจะแสดงข้อความล่าสุดจากผู้สูงอายุก่อนรับเคส เมื่อรับแล้วสามารถเปิดแฟ้ม แชทต่อ
            และปิดเคสได้จากมุมเดียวกัน
          </CardDescription>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="เคสที่กำลังดูแล"
          value={String(activeCases.length)}
          description="จำนวนเคสที่กำลังเปิดดูแลอยู่ตอนนี้"
          tone="doctor"
        />
        <SummaryCard
          label="คิวรอรับเคส"
          value={String(waitingCases.length)}
          description="ผู้สูงอายุที่กำลังรอให้คุณหมอเข้าดูแล"
          tone="doctor"
        />
        <SummaryCard
          label="เคสที่ควรติดตาม"
          value={String(highRiskCases)}
          description="นับจากค่าความดันล่าสุดที่อยู่ในระดับเสี่ยง"
          tone={highRiskCases > 0 ? "alert" : "doctor"}
        />
        <SummaryCard
          label="รองรับหลายเคส"
          value="พร้อม"
          description="คุณหมอหนึ่งคนสามารถรับหลายเคสพร้อมกัน และปิดเฉพาะเคสที่เสร็จแล้วได้"
          tone="doctor"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>คิวรอรับเคส</CardTitle>
          <CardDescription className="mt-2">
            อ่านข้อความย่อจากผู้สูงอายุก่อนรับเคส เพื่อช่วยตัดสินใจว่าจะเปิดแฟ้มหรือรับเคสทันที
          </CardDescription>

          <div className="mt-5 space-y-4">
            {waitingCases.length === 0 ? (
              <p className="rounded-[1.6rem] bg-white/80 px-4 py-5 text-base leading-7 text-slate-600">
                ตอนนี้ยังไม่มีคิวรอรับเคสใหม่
              </p>
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
                  className="rounded-[1.8rem] border border-slate-200 bg-white/92 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight text-slate-950">
                        {item.firstName} {item.lastName}
                      </h3>
                      <p className="text-base text-slate-600">
                        บัญชีผู้สูงอายุ: {item.elderlyUser?.email ?? "ยังไม่เชื่อมบัญชี"}
                      </p>
                      {item.doctorRequestedAt ? (
                        <p className="text-sm text-slate-500">
                          ขอรับเคสเมื่อ {formatDate(item.doctorRequestedAt)}
                        </p>
                      ) : null}
                    </div>
                    <Badge tone={assessment.tone}>{assessment.shortLabel}</Badge>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.4rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ความดันล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {latestBloodPressure
                          ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic} mmHg`
                          : "ยังไม่มีข้อมูล"}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ผล AI ล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {item.aiScans[0]?.summary ?? "ยังไม่มีผลวิเคราะห์จาก AI"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-900">
                      เรื่องที่ผู้สูงอายุแจ้งมา
                    </p>
                    <p className="mt-2 text-base leading-7 text-amber-950">
                      {summarizeText(latestPatientMessage?.content) ??
                        summarizeText(item.doctorRequestNote) ??
                        "ยังไม่มีข้อความจากผู้สูงอายุ กรุณาเปิดแฟ้มเพื่อดูข้อมูลก่อนรับเคส"}
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

        <Card className="border border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_100%)]">
          <CardTitle>เคสที่กำลังดูแล</CardTitle>
          <CardDescription className="mt-2 text-slate-600">
            เคสที่รับแล้วจะเห็นข้อมูลล่าสุดของผู้สูงอายุ พร้อมปุ่มเปิดแฟ้มและปิดเคส
          </CardDescription>

          <div className="mt-5 space-y-4">
            {activeCases.length === 0 ? (
              <p className="rounded-[1.6rem] border border-white/70 bg-white/90 px-4 py-5 text-base leading-7 text-slate-600">
                ยังไม่มีเคสที่กำลังดูแลอยู่
              </p>
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
                  className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight text-slate-950">
                        {item.elderly.firstName} {item.elderly.lastName}
                      </h3>
                      <p className="text-base text-slate-600">
                        บัญชีผู้สูงอายุ: {item.elderly.elderlyUser?.email ?? "ยังไม่เชื่อมบัญชี"}
                      </p>
                      <p className="text-sm text-slate-500">
                        เปิดดูแลเมื่อ {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Badge tone={assessment.tone}>{assessment.shortLabel}</Badge>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.4rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ความดันล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {latestBloodPressure
                          ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic} mmHg`
                          : "ยังไม่มีข้อมูล"}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ผล AI ล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {item.elderly.aiScans[0]?.summary ?? "ยังไม่มีผลวิเคราะห์"}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                        ข้อความล่าสุด
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-700">
                        {summarizeText(latestPatientMessage?.content) ?? "ยังไม่มีข้อความใหม่"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-900">
                      สรุปก่อนเข้าแชท
                    </p>
                    <p className="mt-2 text-base leading-7 text-emerald-950">
                      {summarizeText(latestPatientMessage?.content) ??
                        "ยังไม่มีข้อความใหม่จากผู้สูงอายุ สามารถเปิดแฟ้มเพื่อดูประวัติย้อนหลังและเริ่มตอบกลับได้"}
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
