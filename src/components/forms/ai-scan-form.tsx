"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type AiScanFormProps = {
  elderlyId: string;
};

type ScanKind = "medicine" | "blood-pressure";

function getApiErrorMessage(result: unknown, fallback: string) {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    return result.error;
  }

  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    result.error &&
    typeof result.error === "object"
  ) {
    const firstFieldError = Object.values(result.error as Record<string, unknown>).find(
      (value) => Array.isArray(value) && typeof value[0] === "string",
    ) as string[] | undefined;

    if (firstFieldError?.[0]) {
      return firstFieldError[0];
    }
  }

  return fallback;
}

export function AiScanForm({ elderlyId }: AiScanFormProps) {
  const router = useRouter();
  const [medicineError, setMedicineError] = useState("");
  const [medicineMessage, setMedicineMessage] = useState("");
  const [pressureError, setPressureError] = useState("");
  const [pressureMessage, setPressureMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function submitScan(event: FormEvent<HTMLFormElement>, kind: ScanKind) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (kind === "medicine") {
      setMedicineError("");
      setMedicineMessage("");
    } else {
      setPressureError("");
      setPressureMessage("");
    }

    const response = await fetch(`/api/elderly/${elderlyId}/ai-scan`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      const fallback =
        kind === "medicine"
          ? "สแกนรูปยาไม่สำเร็จ"
          : "สแกนรูปความดันไม่สำเร็จ";
      const errorMessage = getApiErrorMessage(result, fallback);

      if (kind === "medicine") {
        setMedicineError(errorMessage);
      } else {
        setPressureError(errorMessage);
      }

      return;
    }

    form.reset();

    if (kind === "medicine") {
      setMedicineMessage(
        result.aiScan?.summary ?? "สแกนรูปยาและบันทึกผลเรียบร้อยแล้ว",
      );
    } else {
      const savedText = result.bloodPressureRecord
        ? "และบันทึกลงในประวัติความดันแล้ว"
        : "";
      setPressureMessage(
        result.aiScan?.summary
          ? `${result.aiScan.summary} ${savedText}`.trim()
          : `สแกนรูปความดันเรียบร้อยแล้ว ${savedText}`.trim(),
      );
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.97)_100%)]">
        <div className="space-y-3">
          <CardTitle>สแกนยาให้ AI ช่วยดู</CardTitle>
          <CardDescription>
            ใช้ได้ทั้งคอมและมือถือ ถ่ายรูปจากมือถือได้ทันที หรืออัปโหลดรูปจากคอมพิวเตอร์ก็ได้
          </CardDescription>
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-cyan-100 bg-cyan-50/70 p-5">
          <p className="text-base font-bold text-slate-950">AI จะช่วยดูอะไรบ้าง</p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
            <p>1. เดาว่านี่คือยาอะไรจากรูปที่ส่งมา</p>
            <p>2. สรุปว่ายานี้มักใช้ทำอะไรแบบเข้าใจง่าย</p>
            <p>3. เก็บผลการสแกนไว้ในแฟ้มสุขภาพให้อัตโนมัติ</p>
          </div>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => submitScan(event, "medicine")}
        >
          <input type="hidden" name="scanType" value="MEDICINE_IMAGE" />

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">เลือกรูปหรือถ่ายรูปยา</span>
            <Input
              name="file"
              type="file"
              accept="image/*"
              capture="environment"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">ข้อความช่วย AI อ่านเพิ่ม</span>
            <Input
              name="hintText"
              placeholder="เช่น Amlodipine 5mg / กล่องยาสีฟ้า / ยาความดัน"
            />
          </label>

          {medicineError ? (
            <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
              {medicineError}
            </p>
          ) : null}

          {medicineMessage ? (
            <p className="rounded-[1.3rem] bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">
              {medicineMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            fullWidth
            disabled={isPending}
            className="bg-slate-950 hover:bg-slate-800 focus-visible:outline-slate-900"
          >
            {isPending ? "กำลังสแกนรูปยา..." : "สแกนรูปยา"}
          </Button>
        </form>
      </Card>

      <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.97)_100%)]">
        <div className="space-y-3">
          <CardTitle>สแกนค่าความดันจากรูป</CardTitle>
          <CardDescription>
            ถ่ายรูปหน้าจอเครื่องวัดความดันหรืออัปโหลดรูปเดิม แล้วให้ระบบลองอ่านค่าและประเมินให้อัตโนมัติ
          </CardDescription>
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-emerald-100 bg-emerald-50/70 p-5">
          <p className="text-base font-bold text-slate-950">ก่อนถ่ายรูปความดัน</p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
            <p>1. ถ่ายให้เห็นค่าบน ค่าล่าง และชีพจรชัดที่สุด</p>
            <p>2. พยายามไม่ให้มีแสงสะท้อนหน้าจอเครื่องวัด</p>
            <p>3. ระบบจะบันทึกค่าเข้าประวัติให้อัตโนมัติเมื่ออ่านได้</p>
          </div>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => submitScan(event, "blood-pressure")}
        >
          <input type="hidden" name="scanType" value="BLOOD_PRESSURE_IMAGE" />
          <input type="hidden" name="autoCreateRecord" value="true" />

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">เลือกรูปหรือถ่ายรูปความดัน</span>
            <Input
              name="file"
              type="file"
              accept="image/*"
              capture="environment"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">ข้อความช่วย AI อ่านเพิ่ม</span>
            <Input name="hintText" placeholder="เช่น 145/92 pulse 84" />
          </label>

          {pressureError ? (
            <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
              {pressureError}
            </p>
          ) : null}

          {pressureMessage ? (
            <p className="rounded-[1.3rem] bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">
              {pressureMessage}
            </p>
          ) : null}

          <Button type="submit" fullWidth disabled={isPending}>
            {isPending ? "กำลังอ่านค่าความดัน..." : "สแกนความดันและบันทึก"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
