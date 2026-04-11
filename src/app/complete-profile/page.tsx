import { auth } from "@/auth";
import { ElderlyProfileSettingsForm } from "@/components/forms/elderly-profile-settings-form";
import { Card } from "@/components/ui/card";
import { ensureElderlyProfileForUser } from "@/lib/elderly-profile";
import { redirect } from "next/navigation";

type CompleteProfilePageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

function toDateInputValue(value?: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export default async function CompleteProfilePage({
  searchParams,
}: CompleteProfilePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ELDERLY") {
    redirect("/dashboard");
  }

  const { callbackUrl } = await searchParams;
  const profile = await ensureElderlyProfileForUser(session.user.id);

  if (!profile.onboardingRequired) {
    redirect(callbackUrl || "/elderly-portal");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_24%),linear-gradient(180deg,#fffef9_0%,#f2f8ef_100%)]">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,251,235,0.96)_100%)]">
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
                เริ่มใช้งานครั้งแรก
              </p>
              <h1 className="text-[2.3rem] font-black tracking-tight text-slate-950 sm:text-[3.3rem]">
                กรอกข้อมูลทั่วไปก่อนเข้าแอป
              </h1>
              <p className="text-base leading-8 text-slate-600">
                ระบบล็อกอินผ่าน Google หรือ Facebook สำเร็จแล้ว เหลือเพียงกรอกข้อมูลพื้นฐานของผู้สูงอายุให้ครบ เพื่อให้การดูประวัติสุขภาพและการติดต่อคุณหมอทำงานได้พร้อมใช้งาน
              </p>
            </div>

            <div className="mt-6 space-y-3 rounded-[1.7rem] border border-white/70 bg-white/88 p-5 text-sm leading-7 text-slate-700">
              <p>1. เบอร์โทรจะใช้สำหรับติดต่อและแจ้งเตือนในอนาคต</p>
              <p>2. วันเกิดช่วยให้ข้อมูลสุขภาพมีบริบทมากขึ้น</p>
              <p>3. ข้อมูลอื่น ๆ ใส่เพิ่มภายหลังได้ แต่แนะนำให้กรอกตั้งแต่ตอนนี้</p>
            </div>
          </Card>

          <ElderlyProfileSettingsForm
            elderlyId={profile.id}
            profile={{
              firstName: profile.firstName,
              lastName: profile.lastName,
              nationalId: profile.nationalId,
              birthDate: toDateInputValue(profile.birthDate),
              gender: profile.gender,
              phone: profile.phone,
              address: profile.address,
              allergies: profile.allergies,
              chronicDiseases: profile.chronicDiseases,
              notes: profile.notes,
            }}
            title="ข้อมูลทั่วไปของผู้สูงอายุ"
            description="กรอกอย่างน้อยชื่อ นามสกุล วันเกิด และเบอร์โทรให้ครบ แล้วระบบจะพาเข้าใช้งานต่อทันที"
            submitLabel="บันทึกและเริ่มใช้งาน"
            successMessage="บันทึกข้อมูลเรียบร้อยแล้ว กำลังพาไปหน้าใช้งานหลัก"
            afterSaveUrl={callbackUrl || "/elderly-portal"}
          />
        </div>
      </div>
    </div>
  );
}
