import { auth } from "@/auth";
import { AdminCaseAssignment } from "@/components/admin/admin-case-assignment";
import { AdminProfileManagement } from "@/components/admin/admin-profile-management";
import { AdminUserManagement } from "@/components/admin/admin-user-management";
import { AppShell } from "@/components/dashboard/app-shell";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
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
    completedCases,
    selfServiceCases,
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
    prisma.elderlyProfile.count({
      where: { caseStatus: CaseStatus.COMPLETED },
    }),
    prisma.elderlyProfile.count({
      where: { caseStatus: CaseStatus.SELF_SERVICE },
    }),
  ]);

  const totalUsers = users.length;
  const doctorCoverage = profiles.length
    ? Math.round((activeCases / profiles.length) * 100)
    : 0;
  const unassignedProfiles = profiles.filter((profile) => !profile.doctors.length).length;
  const latestUpdatedProfile = profiles[0];

  return (
    <AppShell
      portal="admin"
      title="ศูนย์จัดการระบบ"
      subtitle="ดูภาพรวมผู้ใช้และเคสทั้งหมด จับคู่คุณหมอกับผู้สูงอายุ เปิดหรือรีเซ็ตเคส และจัดการบัญชีจากมุมมองที่อ่านง่ายขึ้น"
      user={session.user}
      navigation={[
        { href: "#overview", label: "ภาพรวมระบบ", eyebrow: "Pulse" },
        { href: "#manage-users", label: "ผู้ใช้ทั้งหมด", eyebrow: "Users" },
        { href: "#case-assignment", label: "จับคู่เคส", eyebrow: "Cases" },
        { href: "#cleanup", label: "ล้างข้อมูล", eyebrow: "Cleanup" },
        { href: "#create", label: "สร้างข้อมูลใหม่", eyebrow: "Create" },
      ]}
      actions={
        <Link
          href="#case-assignment"
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.45rem] border border-amber-300/55 bg-[linear-gradient(135deg,rgba(251,191,36,0.95)_0%,rgba(245,158,11,0.96)_100%)] px-5 py-3 text-base font-bold text-slate-950 shadow-[0_20px_38px_-26px_rgba(217,119,6,0.55)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-[linear-gradient(135deg,rgba(252,211,77,0.98)_0%,rgba(245,158,11,0.98)_100%)]"
        >
          จัดการเคส
        </Link>
      }
    >
      <section id="overview" className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.99)_0%,rgba(255,255,255,0.97)_100%)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Admin command center
              </div>
              <CardTitle>จัดการผู้ใช้ เคส และการเชื่อมหมอจากหน้าหลักเดียว</CardTitle>
              <CardDescription>
                ด้านบนนี้เป็นจุดดูสถานะระบบโดยรวม ส่วนด้านล่างแบ่งพื้นที่สำหรับจัดการผู้ใช้ จับคู่เคส ล้างข้อมูลที่ไม่ใช้แล้ว และสร้างบัญชีหรือแฟ้มใหม่ให้เข้าถึงได้ง่ายขึ้น
              </CardDescription>
            </div>

            <div className="rounded-[1.7rem] border border-amber-100 bg-white/88 px-4 py-4 text-sm leading-7 text-slate-600">
              <p className="font-bold text-slate-900">สถานะล่าสุด</p>
              <p className="mt-2">
                {latestUpdatedProfile
                  ? `แฟ้มที่มีการอัปเดตล่าสุดคือ ${latestUpdatedProfile.firstName} ${latestUpdatedProfile.lastName}`
                  : "ยังไม่มีแฟ้มผู้สูงอายุในระบบ"}
              </p>
              <p className="mt-1">
                {unassignedProfiles > 0
                  ? `ยังมีแฟ้มที่ยังไม่ถูกจับคู่คุณหมอ ${unassignedProfiles} แฟ้ม`
                  : "ทุกแฟ้มที่มีอยู่ถูกเชื่อมกับคุณหมอหรืออยู่ในโหมดใช้งานด้วยตัวเองแล้ว"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <QuickActionCard
              href="#manage-users"
              eyebrow="Users"
              title="จัดการบัญชีทั้งหมด"
              description="เปลี่ยนบทบาทผู้ใช้ให้เป็นคุณหมอ ดูบัญชีที่มีแฟ้มแล้ว และลบบัญชีที่ไม่ใช้"
              tone="admin"
            />
            <QuickActionCard
              href="#case-assignment"
              eyebrow="Cases"
              title="จับคู่หมอกับผู้สูงอายุ"
              description="เลือกคุณหมอประจำเคส เปิดคิวใหม่ หรือยกเลิกการดูแลจากหน้าจัดการเดียว"
              tone="admin"
            />
            <QuickActionCard
              href="#create"
              eyebrow="Create"
              title="สร้างบัญชีและแฟ้ม"
              description="เพิ่มบัญชีใหม่หรือสร้างแฟ้มผู้สูงอายุจากฝั่งแอดมินได้ทันที"
              tone="admin"
            />
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="border-amber-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(255,247,237,0.95)_100%)]">
            <CardTitle>สัดส่วนการดูแลในระบบ</CardTitle>
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                  <span>แฟ้มที่กำลังมีคุณหมอดูแล</span>
                  <span>{doctorCoverage}%</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-amber-100">
                  <div
                    className="h-3 rounded-full bg-amber-500 transition-all"
                    style={{ width: `${doctorCoverage}%` }}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-amber-50 px-4 py-4">
                  <p className="text-sm font-bold text-slate-900">เคสเสร็จสิ้น</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    {completedCases}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-bold text-slate-900">ใช้งานด้วยตัวเอง</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    {selfServiceCases}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,250,252,0.96)_100%)]">
            <CardTitle>เช็กก่อนเริ่มจัดการ</CardTitle>
            <div className="mt-5 space-y-3 text-base leading-8 text-slate-700">
              <p>1. เปิดส่วนผู้ใช้ทั้งหมดเพื่อเช็กว่าบัญชีใดควรถูกตั้งเป็นคุณหมอ</p>
              <p>2. เปิดส่วนจับคู่เคสเพื่อดูว่าแฟ้มใดกำลังรอคุณหมอหรือควรเปลี่ยนผู้ดูแล</p>
              <p>3. ใช้ส่วนล้างข้อมูลเมื่อต้องลบแฟ้มเก่าที่ไม่ใช้งานออกจากระบบอย่างเป็นระเบียบ</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="ผู้ใช้ทั้งหมด"
          value={String(totalUsers)}
          description="รวมทุกบัญชีที่มีอยู่ในระบบตอนนี้"
          tone="admin"
        />
        <SummaryCard
          label="ผู้สูงอายุ"
          value={String(totalElderlyAccounts)}
          description="จำนวนบัญชีผู้สูงอายุที่ใช้พอร์ทัลหลัก"
          tone="admin"
        />
        <SummaryCard
          label="คุณหมอ"
          value={String(totalDoctors)}
          description="จำนวนบัญชีคุณหมอที่พร้อมรับหรือติดตามเคส"
          tone="admin"
        />
        <SummaryCard
          label="รอหมอรับเคส"
          value={String(waitingCases)}
          description="แฟ้มที่กำลังรอให้มีคุณหมอเข้ามาดูแล"
          tone="admin"
        />
        <SummaryCard
          label="กำลังดูแล"
          value={String(activeCases)}
          description="แฟ้มที่มีคุณหมอเปิดติดตามอยู่ในตอนนี้"
          tone="admin"
        />
      </section>

      <section id="manage-users" className="mt-6 grid gap-6 xl:grid-cols-[0.36fr_0.64fr]">
        <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>มุมจัดการผู้ใช้</CardTitle>
          <CardDescription className="mt-2">
            ใช้ส่วนนี้เมื่ออยากดูรายชื่อทั้งหมด แยกบัญชีที่ควรเป็นคุณหมอ และตรวจว่าบัญชีใดผูกกับแฟ้มผู้สูงอายุอยู่แล้ว
          </CardDescription>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.5rem] bg-white/88 p-4">
              <p className="text-sm font-bold text-slate-900">บัญชีคุณหมอ</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {totalDoctors}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/88 p-4">
              <p className="text-sm font-bold text-slate-900">บัญชีผู้สูงอายุ</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {totalElderlyAccounts}
              </p>
            </div>
          </div>
        </Card>

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
      </section>

      <section id="case-assignment" className="mt-6 grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>มุมจับคู่เคส</CardTitle>
          <CardDescription className="mt-2">
            ตรวจดูว่าแฟ้มใดกำลังรอคุณหมอ แฟ้มใดต้องเปิดคิวใหม่ และแฟ้มใดควรเปลี่ยนคุณหมอผู้ดูแลเพื่อให้ระบบไม่ติดค้าง
          </CardDescription>
          <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.5rem] bg-white/88 p-4">
              <p className="text-sm font-bold text-slate-900">รอรับเคส</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {waitingCases}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/88 p-4">
              <p className="text-sm font-bold text-slate-900">กำลังดูแล</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {activeCases}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/88 p-4">
              <p className="text-sm font-bold text-slate-900">ยังไม่ถูกจับคู่</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {unassignedProfiles}
              </p>
            </div>
          </div>
        </Card>

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
      </section>

      <section id="cleanup" className="mt-6 grid gap-6 xl:grid-cols-[0.32fr_0.68fr]">
        <Card className="border-rose-100 bg-[linear-gradient(180deg,rgba(255,241,242,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
          <CardTitle>ล้างข้อมูลอย่างปลอดภัย</CardTitle>
          <CardDescription className="mt-2">
            ใช้ส่วนนี้เฉพาะเมื่อตรวจสอบแล้วว่าแฟ้มไม่ต้องเก็บต่อ เพราะการลบจะลบประวัติความดัน รูปยา ผล AI และแชทของเคสนั้นออกทั้งหมด
          </CardDescription>
          <div className="mt-5 rounded-[1.5rem] bg-white/88 p-4 text-base leading-8 text-slate-700">
            <p>ตรวจชื่อแฟ้มและอีเมลให้ตรงก่อนกดลบทุกครั้ง</p>
            <p>ควรย้ายหรือปิดเคสก่อนลบเพื่อไม่ให้ข้อมูลการดูแลขาดตอน</p>
          </div>
        </Card>

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
      </section>

      <section id="create" className="mt-6 grid gap-6 xl:grid-cols-2">
        <div id="create-user">
          <RegisterForm
            allowedRoles={["ELDERLY", "DOCTOR", "ADMIN"]}
            defaultRole="ELDERLY"
            showRoleSelect
            autoSignIn={false}
            title="สร้างบัญชีใหม่จากฝั่งแอดมิน"
            description="ใช้สำหรับเพิ่มบัญชีผู้สูงอายุ คุณหมอ หรือแอดมินใหม่ โดยไม่กระทบ session ปัจจุบัน"
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
