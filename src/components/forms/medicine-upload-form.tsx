"use client";

import { ImageSourcePicker } from "@/components/forms/image-source-picker";
import {
  fetchWithTimeout,
  optimizeImageFile,
  readApiResponse,
} from "@/lib/client-image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type MedicineUploadFormProps = {
  elderlyId: string;
};

const MEDICINE_UPLOAD_TIMEOUT_MS = 35000;

export function MedicineUploadForm({ elderlyId }: MedicineUploadFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setMessage("");

    if (!selectedFile) {
      setError("กรุณาเลือกรูปยาก่อนบันทึก");
      return;
    }

    setIsSubmitting(true);

    try {
      const optimizedFile = await optimizeImageFile(selectedFile);
      const requestFormData = new FormData();
      const label = String(formData.get("label") ?? "").trim();

      if (label) {
        requestFormData.set("label", label);
      }

      requestFormData.set("file", optimizedFile, optimizedFile.name);

      const response = await fetchWithTimeout(
        `/api/elderly/${elderlyId}/medicine-upload`,
        {
          method: "POST",
          body: requestFormData,
        },
        MEDICINE_UPLOAD_TIMEOUT_MS,
      );

      const result = await readApiResponse(response);

      if (!response.ok) {
        setError(
          result &&
            typeof result === "object" &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "อัปโหลดรูปยาไม่สำเร็จ",
        );
        return;
      }

      form.reset();
      setSelectedFile(null);
      setMessage("บันทึกรูปยาเรียบร้อยแล้ว");
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      console.error("MEDICINE_UPLOAD_FORM_ERROR", submitError);
      setError("อัปโหลดรูปยาไม่สำเร็จ กรุณาลองใช้รูปที่เล็กลงหรือคมชัดขึ้น");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
      <div className="space-y-3">
        <CardTitle>เก็บรูปยาไว้ในแฟ้ม</CardTitle>
        <CardDescription>
          ใช้เมื่ออยากแนบรูปยาเก็บไว้ในระบบก่อน โดยยังไม่ต้องส่งให้ AI วิเคราะห์ก็ได้
        </CardDescription>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-amber-100 bg-amber-50/70 p-5">
        <p className="text-base font-bold text-slate-950">ถ่ายหรือเลือกภาพแบบไหนดีที่สุด</p>
        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
          <p>1. ให้เห็นชื่อยา ขนาดยา หรือฉลากบนซองและกล่องในภาพเดียวกัน</p>
          <p>2. ถ้ามีรูปเดิมอยู่แล้ว สามารถเลือกจากคลังได้เลย ไม่จำเป็นต้องถ่ายใหม่</p>
          <p>3. ถ้าจะให้คุณหมอดูต่อภายหลัง ควรถ่ายภาพให้คมและสว่างพอ</p>
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

        <ImageSourcePicker
          label="รูปยาที่ต้องการบันทึก"
          description="บนมือถือเลือกได้ทั้งถ่ายใหม่หรือเลือกรูปจากคลัง ส่วนคอมจะเลือกรูปจากเครื่องได้ทันที"
          selectedFileName={selectedFile?.name ?? null}
          onSelect={(file) => setSelectedFile(file)}
          onClear={() => setSelectedFile(null)}
          cameraLabel="ถ่ายรูปยา"
          libraryLabel="เลือกรูปยาจากคลัง"
        />

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

        <Button type="submit" fullWidth disabled={isSubmitting || isPending}>
          {isSubmitting || isPending ? "กำลังอัปโหลด..." : "บันทึกรูปยา"}
        </Button>
      </form>
    </Card>
  );
}
