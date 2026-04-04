"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

export function ElderlyForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
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
      doctorEmail: String(formData.get("doctorEmail") ?? ""),
      elderlyEmail: String(formData.get("elderlyEmail") ?? ""),
    };

    setError("");
    setMessage("");

    const response = await fetch("/api/elderly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(typeof result.error === "string" ? result.error : "เพิ่มข้อมูลไม่สำเร็จ");
      return;
    }

    form.reset();
    setMessage(`เพิ่มข้อมูล ${result.firstName} ${result.lastName} สำเร็จแล้ว`);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="space-y-3">
        <CardTitle>สร้างแฟ้มผู้สูงอายุใหม่</CardTitle>
        <CardDescription>
          ใช้สำหรับสร้างข้อมูลผู้สูงอายุและเชื่อมกับบัญชีผู้ใช้หรือคุณหมอเจ้าของเคส
        </CardDescription>
      </div>

      <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">ชื่อ</span>
          <Input name="firstName" required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">นามสกุล</span>
          <Input name="lastName" required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">เลขบัตรประชาชน</span>
          <Input name="nationalId" placeholder="ไม่บังคับ" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">วันเกิด</span>
          <Input name="birthDate" type="date" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">เพศ</span>
          <Select name="gender" defaultValue="">
            <option value="">ไม่ระบุ</option>
            <option value="MALE">ชาย</option>
            <option value="FEMALE">หญิง</option>
            <option value="OTHER">อื่น ๆ</option>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">เบอร์โทร</span>
          <Input name="phone" placeholder="08xxxxxxxx" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-slate-700">ที่อยู่</span>
          <Textarea name="address" className="min-h-24" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">โรคประจำตัว</span>
          <Textarea name="chronicDiseases" className="min-h-24" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">แพ้ยา / แพ้อาหาร</span>
          <Textarea name="allergies" className="min-h-24" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">อีเมลคุณหมอเจ้าของเคส</span>
          <Input name="doctorEmail" type="email" placeholder="doctor@example.com" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">อีเมลบัญชีผู้สูงอายุ</span>
          <Input name="elderlyEmail" type="email" placeholder="elderly@example.com" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-slate-700">หมายเหตุเพิ่มเติม</span>
          <Textarea name="notes" className="min-h-24" />
        </label>

        {error ? (
          <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-[1.3rem] bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700 md:col-span-2">
            {message}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <Button type="submit" fullWidth disabled={isPending}>
            {isPending ? "กำลังบันทึก..." : "บันทึกแฟ้มผู้สูงอายุ"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
