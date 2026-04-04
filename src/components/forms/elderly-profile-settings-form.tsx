"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type ElderlyProfileSettingsFormProps = {
  elderlyId: string;
  profile: {
    firstName: string;
    lastName: string;
    nationalId?: string | null;
    birthDate?: string | null;
    gender?: "MALE" | "FEMALE" | "OTHER" | null;
    phone?: string | null;
    address?: string | null;
    allergies?: string | null;
    chronicDiseases?: string | null;
    notes?: string | null;
  };
};

export function ElderlyProfileSettingsForm({
  elderlyId,
  profile,
}: ElderlyProfileSettingsFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      nationalId: String(formData.get("nationalId") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      gender: String(formData.get("gender") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      allergies: String(formData.get("allergies") ?? ""),
      chronicDiseases: String(formData.get("chronicDiseases") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };

    setError("");
    setMessage("");

    const response = await fetch(`/api/elderly/${elderlyId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        typeof result.error === "string"
          ? result.error
          : "บันทึกข้อมูลไม่สำเร็จ",
      );
      return;
    }

    setMessage("อัปเดตแฟ้มผู้สูงอายุเรียบร้อยแล้ว");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(240,253,244,0.96)_100%)]">
      <div className="space-y-2">
        <CardTitle>ตั้งค่าแฟ้มสุขภาพ</CardTitle>
        <CardDescription>
          ปรับข้อมูลส่วนตัว โรคประจำตัว อาการแพ้ และหมายเหตุให้เป็นปัจจุบัน
        </CardDescription>
      </div>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">ชื่อ</span>
          <Input name="firstName" defaultValue={profile.firstName} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">นามสกุล</span>
          <Input name="lastName" defaultValue={profile.lastName} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">เลขบัตรประชาชน</span>
          <Input name="nationalId" defaultValue={profile.nationalId ?? ""} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">วันเกิด</span>
          <Input name="birthDate" type="date" defaultValue={profile.birthDate ?? ""} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">เพศ</span>
          <Select name="gender" defaultValue={profile.gender ?? ""}>
            <option value="">ไม่ระบุ</option>
            <option value="MALE">ชาย</option>
            <option value="FEMALE">หญิง</option>
            <option value="OTHER">อื่น ๆ</option>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">เบอร์โทร</span>
          <Input name="phone" defaultValue={profile.phone ?? ""} />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">ที่อยู่</span>
          <Textarea name="address" className="min-h-20" defaultValue={profile.address ?? ""} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">โรคประจำตัว</span>
          <Textarea
            name="chronicDiseases"
            className="min-h-20"
            defaultValue={profile.chronicDiseases ?? ""}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">แพ้ยา / แพ้อาหาร</span>
          <Textarea
            name="allergies"
            className="min-h-20"
            defaultValue={profile.allergies ?? ""}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">หมายเหตุเพิ่มเติม</span>
          <Textarea name="notes" className="min-h-20" defaultValue={profile.notes ?? ""} />
        </label>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">
            {message}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <Button type="submit" fullWidth disabled={isPending}>
            {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลแฟ้มสุขภาพ"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
