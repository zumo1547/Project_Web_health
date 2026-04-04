"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBloodPressureAssessment } from "@/lib/health-presenters";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type BloodPressureFormProps = {
  elderlyId: string;
};

export function BloodPressureForm({ elderlyId }: BloodPressureFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const systolic = Number(formData.get("systolic"));
    const diastolic = Number(formData.get("diastolic"));

    const payload = {
      systolic,
      diastolic,
      pulse: formData.get("pulse") ? Number(formData.get("pulse")) : undefined,
      measuredAt: String(formData.get("measuredAt")),
      note: String(formData.get("note") ?? ""),
    };

    setError("");
    setMessage("");

    const response = await fetch(`/api/elderly/${elderlyId}/blood-pressure`, {
      method: "POST",
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
          : "บันทึกค่าความดันไม่สำเร็จ",
      );
      return;
    }

    const assessment = getBloodPressureAssessment(systolic, diastolic);

    form.reset();
    setMessage(
      `บันทึกเรียบร้อยแล้ว ระบบประเมินเบื้องต้นว่า "${assessment.shortLabel}" และแนะนำว่า ${assessment.guidance}`,
    );
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.97)_100%)]">
      <div className="space-y-3">
        <CardTitle>กรอกค่าความดันด้วยตัวเอง</CardTitle>
        <CardDescription>
          ใช้เมื่อมีค่าจากเครื่องวัดอยู่แล้ว ระบบจะช่วยประเมินว่าอยู่ในระดับปกติ ต่ำ หรือควรเฝ้าระวัง
        </CardDescription>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-emerald-100 bg-emerald-50/70 p-5">
        <p className="text-base font-bold text-slate-950">คำแนะนำก่อนกรอก</p>
        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
          <p>1. นั่งพักก่อนวัดประมาณ 5 นาที</p>
          <p>2. กรอกค่าบนและค่าล่างตามหน้าจอเครื่องวัด</p>
          <p>3. หากมีอาการผิดปกติให้พิมพ์หมายเหตุไว้ด้วย</p>
        </div>
      </div>

      <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">ค่าบน (Systolic)</span>
          <Input name="systolic" type="number" min={60} max={260} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">ค่าล่าง (Diastolic)</span>
          <Input name="diastolic" type="number" min={40} max={160} required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">ชีพจร</span>
          <Input name="pulse" type="number" min={30} max={220} placeholder="ไม่กรอกก็ได้" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">วันที่และเวลาที่วัด</span>
          <Input
            name="measuredAt"
            type="datetime-local"
            defaultValue={new Date().toISOString().slice(0, 16)}
            required
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-bold text-slate-700">หมายเหตุเพิ่มเติม</span>
          <Textarea
            name="note"
            className="min-h-24"
            placeholder="เช่น วัดหลังตื่นนอน / มีอาการเวียนหัวเล็กน้อย / วัดหลังรับประทานยาแล้ว"
          />
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
            {isPending ? "กำลังบันทึก..." : "บันทึกค่าความดัน"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
