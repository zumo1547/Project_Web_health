import { auth } from "@/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChatPanel } from "@/components/forms/chat-panel";
import { DoctorHospitalSharePanel } from "@/components/forms/doctor-hospital-share-panel";
import { ElderlyProfileSettingsForm } from "@/components/forms/elderly-profile-settings-form";
import { RecordDeleteButton } from "@/components/forms/record-delete-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { DoctorCaseStatus, Role } from "@/generated/prisma";
import { formatSystemDateTime } from "@/lib/date-time";
import {
  getBloodPressureAssessment,
  getCaseStatusContent,
} from "@/lib/health-presenters";
import {
  assertElderlyReadAccess,
  canAccessAdminPortal,
  canAccessDoctorPortal,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type ElderlyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return formatSystemDateTime(date);
}

function getAge(date?: Date | null) {
  if (!date) return null;

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
}

function summarizeText(value?: string | null) {
  if (!value) return null;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) {
    return normalized;
  }

  return `${normalized.slice(0, 157)}...`;
}

export default async function ElderlyDetailPage({
  params,
}: ElderlyDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  await assertElderlyReadAccess(id);

  const elderly = await prisma.elderlyProfile.findUnique({
    where: { id },
    include: {
      bloodPressures: {
        orderBy: {
          measuredAt: "desc",
        },
        take: 24,
      },
      medicineImages: {
        orderBy: {
          uploadedAt: "desc",
        },
        take: 24,
      },
      aiScans: {
        orderBy: {
          createdAt: "desc",
        },
        take: 24,
      },
      chatMessages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 40,
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
      elderlyUser: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          bloodPressures: true,
          medicineImages: true,
          aiScans: true,
          chatMessages: true,
          aiHealthMessages: true,
        },
      },
    },
  });

  if (!elderly) {
    notFound();
  }

  const portal = canAccessAdminPortal(session.user.role)
    ? "admin"
    : canAccessDoctorPortal(session.user.role)
      ? "doctor"
      : "elderly";
  const canEditProfile =
    session.user.role === Role.ADMIN || session.user.role === Role.ELDERLY;
  const isAssignedDoctor = elderly.doctors.some(
    (item) => item.doctor.id === session.user.id,
  );
  const canUseCaseChat =
    session.user.role === Role.ADMIN ||
    session.user.role === Role.ELDERLY ||
    isAssignedDoctor;
  const canDeleteUploads =
    session.user.role === Role.ADMIN ||
    session.user.role === Role.ELDERLY ||
    isAssignedDoctor;
  const latestPatientMessage = [...elderly.chatMessages]
    .reverse()
    .find((message) => message.senderRole === Role.ELDERLY);
  const canShareNearbyHospitals =
    canUseCaseChat &&
    (session.user.role === Role.ADMIN || session.user.role === Role.DOCTOR);
  const backHref =
    portal === "admin" ? "/admin" : portal === "doctor" ? "/doctor" : "/elderly-portal";
  const backLabel =
    portal === "admin"
      ? "กลับไปหน้าฝั่งแอดมิน"
      : portal === "doctor"
        ? "กลับไปหน้าคุณหมอ"
        : "กลับไปหน้าหลักผู้สูงอายุ";

  const backButtonClass =
    portal === "doctor"
      ? "inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_36px_-24px_rgba(16,185,129,0.9)] transition hover:bg-emerald-500"
      : portal === "admin"
        ? "inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_36px_-24px_rgba(245,158,11,0.75)] transition hover:bg-amber-600"
        : "inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_36px_-24px_rgba(4,120,87,0.7)] transition hover:bg-emerald-800";
  const age = getAge(elderly.birthDate);
  const latestBloodPressure = elderly.bloodPressures[0];
  const bloodPressureAssessment = getBloodPressureAssessment(
    latestBloodPressure?.systolic,
    latestBloodPressure?.diastolic,
  );
  const caseStatusContent = getCaseStatusContent(elderly.caseStatus);

  return (
    <AppShell
      portal={portal}
      title={`แฟ้มสุขภาพ: ${elderly.firstName} ${elderly.lastName}`}
      subtitle="ดูประวัติการอัปโหลดทั้งหมด สถิติสุขภาพ และเปิดแชทของเคสได้จากหน้านี้"
      user={session.user}
      actions={
        <Link
          href={backHref}
          className={backButtonClass}
        >
          {backLabel}
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="ค่าความดันล่าสุด"
          value={
            latestBloodPressure
              ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic}`
              : "--/--"
          }
          description={bloodPressureAssessment.guidance}
          tone={bloodPressureAssessment.tone === "rose" ? "alert" : "elderly"}
        />
        <SummaryCard
          label="ประวัติความดัน"
          value={String(elderly._count.bloodPressures)}
          description="จำนวนครั้งที่บันทึกความดันไว้ในระบบ"
          tone="elderly"
        />
        <SummaryCard
          label="รูปยา / ผล AI"
          value={`${elderly._count.medicineImages} / ${elderly._count.aiScans}`}
          description="จำนวนรูปยาที่แนบไว้และจำนวนผลวิเคราะห์จาก AI"
          tone="elderly"
        />
        <SummaryCard
          label="สถานะเคส"
          value={caseStatusContent.label}
          description={caseStatusContent.description}
          tone="elderly"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl font-black tracking-tight">
                    {elderly.firstName} {elderly.lastName}
                  </CardTitle>
                  {age !== null ? <Badge tone="amber">อายุ {age} ปี</Badge> : null}
                  {elderly.phone ? <Badge tone="slate">{elderly.phone}</Badge> : null}
                  <Badge tone={caseStatusContent.tone}>{caseStatusContent.label}</Badge>
                </div>
                <CardDescription>
                  อัปเดตล่าสุด {formatDate(elderly.updatedAt)}
                </CardDescription>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {elderly.doctors.length
                  ? `คุณหมอที่ดูแล: ${elderly.doctors.map((item) => item.doctor.name).join(", ")}`
                  : "ยังไม่มีคุณหมอดูแลอยู่ในขณะนี้"}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">บัญชีผู้สูงอายุ</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {elderly.elderlyUser
                    ? `${elderly.elderlyUser.name} (${elderly.elderlyUser.email})`
                    : "ยังไม่เชื่อมบัญชี"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">โรคประจำตัว</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {elderly.chronicDiseases || "ยังไม่ระบุ"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">แพ้ยา / แพ้อาหาร</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {elderly.allergies || "ยังไม่ระบุ"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">เลขบัตรประชาชน</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {elderly.nationalId || "ยังไม่ได้ระบุ"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">ที่อยู่</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {elderly.address || "ยังไม่ระบุ"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">หมายเหตุเพิ่ม</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {elderly.notes || "ยังไม่มีหมายเหตุ"}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>ประวัติความดัน</CardTitle>
            <CardDescription className="mt-2">
              ดูค่าความดันย้อนหลังทั้งหมดของแฟ้มนี้
            </CardDescription>
            <div className="mt-5 space-y-3">
              {elderly.bloodPressures.map((record) => {
                const assessment = getBloodPressureAssessment(
                  record.systolic,
                  record.diastolic,
                );

                return (
                  <div
                    key={record.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-semibold text-slate-900">
                        {record.systolic}/{record.diastolic} mmHg
                        {record.pulse ? ` ชีพจร ${record.pulse}` : ""}
                      </p>
                      <Badge tone={assessment.tone}>{assessment.shortLabel}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      วัดเมื่อ {formatDate(record.measuredAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {record.note || "ไม่มีหมายเหตุเพิ่มเติม"}
                    </p>
                  </div>
                );
              })}

              {elderly.bloodPressures.length === 0 ? (
                <p className="text-sm text-slate-500">ยังไม่มีประวัติความดัน</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardTitle>ประวัติรูปยาและผล AI</CardTitle>
            <CardDescription className="mt-2">
              ใช้ดูสิ่งที่เคยอัปโหลดและผลวิเคราะห์ยาหรือรูปความดันย้อนหลัง
            </CardDescription>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {elderly.aiScans.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {scan.scanType === "MEDICINE_IMAGE"
                        ? "สแกนรูปยา"
                        : "สแกนรูปความดัน"}
                    </p>
                    <Badge tone="amber">
                      ความมั่นใจ {Math.round((scan.confidence ?? 0) * 100)}%
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {scan.summary || "ยังไม่มีสรุปผล"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{formatDate(scan.createdAt)}</span>
                    <a
                      href={scan.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-emerald-700"
                    >
                      เปิดรูปต้นฉบับ
                    </a>
                    {canDeleteUploads ? (
                      <RecordDeleteButton
                        endpoint={`/api/elderly/${elderly.id}/ai-scan/${scan.id}`}
                        confirmMessage="ต้องการลบผลสแกนนี้ใช่หรือไม่? หากรูปนี้อัปผิด ระบบจะลบผลวิเคราะห์และรายการที่เกี่ยวข้องออกจากแฟ้มด้วย"
                        label="ลบผลสแกน"
                      />
                    ) : null}
                  </div>
                </div>
              ))}

              {elderly.aiScans.length === 0 ? (
                <p className="text-sm text-slate-500">ยังไม่มีผลสแกนจาก AI</p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {elderly.medicineImages.map((image) => (
                <div
                  key={image.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {image.label || "รูปยาที่ยังไม่ได้ใส่ชื่อกำกับ"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    อัปโหลดเมื่อ {formatDate(image.uploadedAt)}
                  </p>
                  <a
                    href={image.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    เปิดรูป
                  </a>
                  {canDeleteUploads ? (
                    <RecordDeleteButton
                      endpoint={`/api/elderly/${elderly.id}/medicine-upload/${image.id}`}
                      confirmMessage="ต้องการลบรูปยานี้ใช่หรือไม่? หากเคยสแกนด้วย AI มาก่อน ผลวิเคราะห์ที่เกี่ยวข้องจะถูกลบออกด้วย"
                      label="ลบรูปนี้"
                      className="mt-3"
                    />
                  ) : null}
                </div>
              ))}

              {elderly.medicineImages.length === 0 ? (
                <p className="text-sm text-slate-500">ยังไม่มีรูปยาที่อัปโหลด</p>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {canShareNearbyHospitals ? (
            <section id="hospital-guidance">
              <DoctorHospitalSharePanel
                elderlyId={elderly.id}
                patientName={`${elderly.firstName} ${elderly.lastName}`.trim()}
                savedLocation={{
                  latitude: elderly.lastKnownLatitude,
                  longitude: elderly.lastKnownLongitude,
                  label: elderly.lastKnownLocationLabel,
                  updatedAt: elderly.lastKnownLocationUpdatedAt?.toISOString() ?? null,
                }}
              />
            </section>
          ) : null}

          {canUseCaseChat ? (
            <ChatPanel
              elderlyId={elderly.id}
              currentUserId={session.user.id}
              title="แชทของเคสนี้"
              description="หากคุณหมอรับเคสแล้ว สามารถคุยต่อในห้องนี้ได้ทันที และเมื่อปิดเคสห้องแชทจะเริ่มใหม่สำหรับครั้งถัดไป"
              emptyMessage="ยังไม่มีข้อความในเคสนี้ เริ่มส่งข้อความแรกได้เลย"
              placeholder="เช่น ช่วยดูอาการเวียนหัวหลังวัดความดัน / วันนี้กินยาตามเวลาแล้ว"
              hasActiveDoctor={elderly.doctors.length > 0}
              notice={
                session.user.role === Role.DOCTOR
                  ? "ห้องแชทนี้ใช้คุยกับผู้สูงอายุที่คุณรับเคสแล้ว หากปิดเคสสำเร็จ ห้องแชทจะรีเซ็ตสำหรับการขอคำปรึกษาครั้งถัดไป"
                  : "สามารถคุยต่อในเคสนี้ได้ทันที และหากปิดเคสแล้วการทักครั้งใหม่จะเริ่มเป็นห้องแชทใหม่"
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
          ) : (
            <Card>
              <CardTitle>ข้อความก่อนรับเคส</CardTitle>
              <CardDescription className="mt-2">
                หน้านี้เปิดดูแฟ้มได้ก่อนรับเคส แต่ห้องแชทเต็มจะเปิดให้เมื่อคุณหมอรับเคสแล้ว
              </CardDescription>
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  เรื่องที่ผู้สูงอายุทักมา
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-950">
                  {summarizeText(latestPatientMessage?.content) ??
                    summarizeText(elderly.doctorRequestNote) ??
                    "ยังไม่มีข้อความจากผู้สูงอายุ"}
                </p>
                {latestPatientMessage ? (
                  <p className="mt-2 text-xs text-amber-800">
                    ข้อความล่าสุดเมื่อ {formatDate(latestPatientMessage.createdAt)}
                  </p>
                ) : null}
              </div>
            </Card>
          )}

          {canEditProfile ? (
            <ElderlyProfileSettingsForm
              elderlyId={elderly.id}
              profile={{
                firstName: elderly.firstName,
                lastName: elderly.lastName,
                nationalId: elderly.nationalId,
                birthDate: elderly.birthDate
                  ? elderly.birthDate.toISOString().slice(0, 10)
                  : null,
                gender: elderly.gender,
                phone: elderly.phone,
                address: elderly.address,
                allergies: elderly.allergies,
                chronicDiseases: elderly.chronicDiseases,
                notes: elderly.notes,
              }}
            />
          ) : (
            <Card>
              <CardTitle>มุมมองสำหรับคุณหมอ</CardTitle>
              <CardDescription className="mt-2">
                เปิดดูประวัติย้อนหลัง ค่าความดัน รูปยา และผล AI ได้จากหน้านี้ พร้อมอ่านข้อความก่อนรับเคสหรือแชทต่อในเคสที่รับแล้ว
              </CardDescription>
            </Card>
          )}

          <Card className="border border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.96)_0%,rgba(240,253,244,0.94)_100%)]">
            <CardTitle>สถิติในแฟ้มนี้</CardTitle>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="text-sm font-medium text-slate-500">ความดันที่บันทึก</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {elderly._count.bloodPressures}
                </p>
              </div>
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="text-sm font-medium text-slate-500">รูปยา</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {elderly._count.medicineImages}
                </p>
              </div>
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="text-sm font-medium text-slate-500">ผล AI</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {elderly._count.aiScans}
                </p>
              </div>
              <div className="rounded-3xl bg-white/80 p-4">
                <p className="text-sm font-medium text-slate-500">แชททั้งหมด</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {elderly._count.chatMessages + elderly._count.aiHealthMessages}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
