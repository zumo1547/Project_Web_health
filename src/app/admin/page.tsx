import { auth } from "@/auth";
import { AdminCaseAssignment } from "@/components/admin/admin-case-assignment";
import { AdminProfileManagement } from "@/components/admin/admin-profile-management";
import { AdminUserManagement } from "@/components/admin/admin-user-management";
import { AppShell } from "@/components/dashboard/app-shell";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ElderlyForm } from "@/components/forms/elderly-form";
import { RegisterForm } from "@/components/forms/register-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CaseStatus, DoctorCaseStatus, Role } from "@/generated/prisma";
import { canAccessAdminPortal } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin-login");
  }

  if (!canAccessAdminPortal(session.user.role)) {
    redirect("/dashboard");
  }

  const [
    users,
    doctors,
    profiles,
    totalDoctors,
    totalElderlyAccounts,
    waitingCases,
    activeCases,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        elderlyProfile: {
          select: {
            id: true,
          },
        },
        doctorPatients: {
          where: {
            status: DoctorCaseStatus.ACTIVE,
          },
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.elderlyProfile.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
        caseStatus: true,
        doctorRequestNote: true,
        elderlyUser: {
          select: {
            email: true,
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
      },
    }),
    prisma.user.count({
      where: { role: Role.DOCTOR },
    }),
    prisma.user.count({
      where: { role: Role.ELDERLY },
    }),
    prisma.elderlyProfile.count({
      where: { caseStatus: CaseStatus.WAITING_DOCTOR },
    }),
    prisma.elderlyProfile.count({
      where: { caseStatus: CaseStatus.IN_REVIEW },
    }),
  ]);

  return (
    <AppShell
      portal="admin"
      title="ศูนย์จัดการระบบ"
      subtitle="ดูผู้ใช้ทั้งหมด ตั้งผู้ใช้ให้เป็นคุณหมอ จับคู่คุณหมอกับผู้สูงอายุ และลบข้อมูลที่ไม่ใช้งานแล้วได้จากหน้ารวมเดียว"
      user={session.user}
      actions={
        <Link
          href="#case-assignment"
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] bg-amber-600 px-5 py-3 text-base font-bold text-white transition hover:bg-amber-700"
        >
          จัดการเคส
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="ผู้ใช้ทั้งหมด"
          value={String(users.length)}
          description="รวมทุกบัญชีที่มีอยู่ในระบบตอนนี้"
          tone="admin"
        />
        <SummaryCard
          label="ผู้สูงอายุ"
          value={String(totalElderlyAccounts)}
          description="จำนวนบัญชีที่ใช้เข้าสู่พอร์ทัลผู้สูงอายุ"
          tone="admin"
        />
        <SummaryCard
          label="คุณหมอ"
          value={String(totalDoctors)}
          description="จำนวนบัญชีคุณหมอที่พร้อมรับเคส"
          tone="admin"
        />
        <SummaryCard
          label="รอคุณหมอรับเคส"
          value={String(waitingCases)}
          description="จำนวนแฟ้มที่เปิดรอให้คุณหมอเข้าดูแล"
          tone="admin"
        />
        <SummaryCard
          label="กำลังดูแลอยู่"
          value={String(activeCases)}
          description="จำนวนแฟ้มที่มีคุณหมอกำลังดูแลอยู่"
          tone="admin"
        />
      </section>

      <Card className="mt-6 border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,251,235,0.96)_100%)]">
        <div className="space-y-3">
          <CardTitle>ทางลัดสำหรับแอดมิน</CardTitle>
          <CardDescription>
            กดเข้าแต่ละส่วนได้ทันที เพื่อเช็กผู้ใช้ คุณหมอ การจับคู่เคส และล้างข้อมูลที่ไม่ใช้แล้วจากหน้าเดียว
          </CardDescription>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            href="#manage-users"
            className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 transition hover:border-amber-200 hover:bg-amber-50"
          >
            จัดการผู้ใช้ทั้งหมด
          </Link>
          <Link
            href="#case-assignment"
            className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 transition hover:border-amber-200 hover:bg-amber-50"
          >
            จัดการจับคู่เคส
          </Link>
          <Link
            href="#cleanup"
            className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 transition hover:border-amber-200 hover:bg-amber-50"
          >
            ล้างข้อมูลที่ไม่ใช้
          </Link>
          <Link
            href="#create-user"
            className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 transition hover:border-amber-200 hover:bg-amber-50"
          >
            สร้างบัญชีใหม่
          </Link>
          <Link
            href="#create-profile"
            className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 transition hover:border-amber-200 hover:bg-amber-50"
          >
            สร้างแฟ้มผู้สูงอายุ
          </Link>
          <Link
            href="/doctor"
            className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 transition hover:border-amber-200 hover:bg-amber-50"
          >
            เปิดโหมดคุณหมอ
          </Link>
        </div>
      </Card>

      <section className="mt-6 grid gap-6">
        <div id="manage-users">
          <AdminUserManagement
            currentUserId={session.user.id}
            users={users.map((user) => ({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role as "ADMIN" | "DOCTOR" | "ELDERLY" | "CAREGIVER",
              createdAt: user.createdAt.toISOString(),
              elderlyProfileId: user.elderlyProfile?.id ?? null,
              doctorCaseCount: user.doctorPatients.length,
            }))}
          />
        </div>

        <div id="case-assignment">
          <AdminCaseAssignment
            doctors={doctors}
            profiles={profiles.map((profile) => ({
              id: profile.id,
              fullName: `${profile.firstName} ${profile.lastName}`,
              caseStatus: profile.caseStatus,
              doctorRequestNote: profile.doctorRequestNote,
              doctors: profile.doctors.map((item) => item.doctor),
            }))}
          />
        </div>

        <div id="cleanup">
          <AdminProfileManagement
            profiles={profiles.map((profile) => ({
              id: profile.id,
              fullName: `${profile.firstName} ${profile.lastName}`,
              updatedAt: profile.updatedAt.toISOString(),
              caseStatus: profile.caseStatus,
              doctorNames: profile.doctors.map((item) => item.doctor.name),
              elderlyEmail: profile.elderlyUser?.email ?? null,
            }))}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div id="create-user">
          <RegisterForm
            allowedRoles={["ELDERLY", "DOCTOR", "ADMIN"]}
            defaultRole="ELDERLY"
            showRoleSelect
            autoSignIn={false}
            title="สร้างบัญชีใหม่จากฝั่งแอดมิน"
            description="ใช้สร้างบัญชีผู้สูงอายุ คุณหมอ หรือแอดมินเพิ่ม โดยไม่กระทบ session ปัจจุบัน"
            submitLabel="สร้างบัญชี"
            className="max-w-none"
          />
        </div>

        <div id="create-profile">
          <ElderlyForm />
        </div>
      </section>
    </AppShell>
  );
}
