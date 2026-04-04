"use client";

import { buildOptimizedFormData, readApiResponse } from "@/lib/client-image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type MedicineUploadFormProps = {
  elderlyId: string;
};

export function MedicineUploadForm({ elderlyId }: MedicineUploadFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setError("");
    setMessage("");

    try {
      const formData = await buildOptimizedFormData(form);
      const response = await fetch(`/api/elderly/${elderlyId}/medicine-upload`, {
        method: "POST",
        body: formData,
      });

      const result = await readApiResponse(response);

      if (!response.ok) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "อัปโหลดรูปยาไม่สำเร็จ",
        );
        return;
      }

      form.reset();
      setMessage("บันทึกรูปยาเรียบร้อยแล้ว");
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      console.error("MEDICINE_UPLOAD_FORM_ERROR", submitError);
      setError("อัปโหลดรูปยาไม่สำเร็จ กรุณาลองรูปที่เล็กลงหรือชัดขึ้น");
    }
  }

  return (
    <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
      <div className="space-y-3">
        <CardTitle>เก็บรูปยาไว้ในแฟ้ม</CardTitle>
        <CardDescription>
          ใช้เมื่ออยากแนบรูปยาเก็บไว้ในระบบก่อน โดยยังไม่ต้องสแกนกับ AI ก็ได้
        </CardDescription>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-amber-100 bg-amber-50/70 p-5">
        <p className="text-base font-bold text-slate-950">ถ่ายรูปอย่างไรให้ดูง่าย</p>
        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
          <p>1. วางกล่องยาหรือแผงยาในที่มีแสงพอ</p>
          <p>2. ถ่ายให้เห็นชื่อยาและขนาดยาให้ชัด</p>
          <p>3. มือถือกดถ่ายรูปได้ทันทีจากปุ่มเลือกไฟล์</p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-700">ชื่อกำกับรูป</span>
          <Input
            name="label"
            placeholder="เช่น ยาความดันช่วงเช้า / ยาหลังอาหารเย็น"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-700">เลือกรูปหรือถ่ายรูป</span>
          <Input name="file" type="file" accept="image/*" capture="environment" required />
        </label>

        {error ? (
          <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-[1.3rem] bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">
            {message}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "กำลังอัปโหลด..." : "บันทึกรูปยา"}
        </Button>
      </form>
    </Card>
  );
}
