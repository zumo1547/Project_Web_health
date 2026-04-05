"use client";

import { ImageSourcePicker } from "@/components/forms/image-source-picker";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchWithTimeout,
  optimizeImageFile,
  readApiResponse,
} from "@/lib/client-image";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type AiScanFormProps = {
  elderlyId: string;
  showMedicine?: boolean;
  showBloodPressure?: boolean;
};

type ScanKind = "medicine" | "blood-pressure";

const AI_SCAN_TIMEOUT_MS = 45000;

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
    const fieldErrors = Object.values(result.error as Record<string, unknown>);
    const firstArray = fieldErrors.find(
      (value) => Array.isArray(value) && typeof value[0] === "string",
    ) as string[] | undefined;

    if (firstArray?.[0]) {
      return firstArray[0];
    }
  }

  return fallback;
}

export function AiScanForm({
  elderlyId,
  showMedicine = true,
  showBloodPressure = true,
}: AiScanFormProps) {
  const router = useRouter();
  const [medicineFile, setMedicineFile] = useState<File | null>(null);
  const [pressureFile, setPressureFile] = useState<File | null>(null);
  const [medicineError, setMedicineError] = useState("");
  const [medicineMessage, setMedicineMessage] = useState("");
  const [pressureError, setPressureError] = useState("");
  const [pressureMessage, setPressureMessage] = useState("");
  const [activeScan, setActiveScan] = useState<ScanKind | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitScan(event: FormEvent<HTMLFormElement>, kind: ScanKind) {
    event.preventDefault();

    const form = event.currentTarget;
    const baseFormData = new FormData(form);
    const selectedFile = kind === "medicine" ? medicineFile : pressureFile;

    if (kind === "medicine") {
      setMedicineError("");
      setMedicineMessage("");
    } else {
      setPressureError("");
      setPressureMessage("");
    }

    if (!selectedFile) {
      const message =
        kind === "medicine"
          ? "กรุณาเลือกรูปยาก่อนสแกน"
          : "กรุณาเลือกรูปค่าความดันก่อนสแกน";

      if (kind === "medicine") {
        setMedicineError(message);
      } else {
        setPressureError(message);
      }

      return;
    }

    try {
      setActiveScan(kind);

      const optimizedFile = await optimizeImageFile(selectedFile);
      const requestFormData = new FormData();

      requestFormData.set(
        "scanType",
        kind === "medicine" ? "MEDICINE_IMAGE" : "BLOOD_PRESSURE_IMAGE",
      );
      requestFormData.set("file", optimizedFile, optimizedFile.name);

      const hintText = String(baseFormData.get("hintText") ?? "").trim();
      if (hintText) {
        requestFormData.set("hintText", hintText);
      }

      if (kind === "blood-pressure") {
        requestFormData.set("autoCreateRecord", "true");
      }

      const response = await fetchWithTimeout(
        `/api/elderly/${elderlyId}/ai-scan`,
        {
          method: "POST",
          body: requestFormData,
        },
        AI_SCAN_TIMEOUT_MS,
      );

      const result = await readApiResponse(response);

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
        setMedicineFile(null);
        setMedicineMessage(
          (result as { aiScan?: { summary?: string } }).aiScan?.summary ??
            "สแกนรูปยาและบันทึกผลเรียบร้อยแล้ว",
        );
      } else {
        setPressureFile(null);

        const payload = result as {
          aiScan?: { summary?: string };
          bloodPressureRecord?: unknown;
        };
        const savedText = payload.bloodPressureRecord
          ? "และบันทึกลงในประวัติความดันแล้ว"
          : "";

        setPressureMessage(
          payload.aiScan?.summary
            ? `${payload.aiScan.summary} ${savedText}`.trim()
            : `สแกนรูปความดันเรียบร้อยแล้ว ${savedText}`.trim(),
        );
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("AI_SCAN_FORM_ERROR", error);

      const fallback =
        kind === "medicine"
          ? "สแกนรูปยาไม่สำเร็จ กรุณาลองใช้รูปที่คมชัดขึ้นหรือพิมพ์ชื่อยาช่วย AI เพิ่ม"
          : "สแกนรูปความดันไม่สำเร็จ กรุณาลองใช้รูปที่คมชัดขึ้นหรือพิมพ์ค่าช่วย AI เพิ่ม";

      if (kind === "medicine") {
        setMedicineError(fallback);
      } else {
        setPressureError(fallback);
      }
    } finally {
      setActiveScan(null);
    }
  }

  if (!showMedicine && !showBloodPressure) {
    return null;
  }

  return (
    <div className="space-y-6">
      {showMedicine ? (
        <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.97)_100%)]">
          <div className="space-y-3">
            <CardTitle>สแกนยาให้ AI ช่วยดู</CardTitle>
            <CardDescription>
              ใช้ได้ทั้งคอมและมือถือ เลือกได้ว่าจะถ่ายรูปใหม่จากกล้องหรือหยิบรูปเดิมจากคลังก่อนส่งให้ AI
              ตรวจ
            </CardDescription>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-cyan-100 bg-cyan-50/70 p-5">
            <p className="text-base font-bold text-slate-950">
              ถ้าต้องการให้ AI อ่านยาได้ง่ายขึ้น
            </p>
            <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
              <p>1. ถ่ายให้เห็นชื่อยา ขนาดยา หรือฉลากบนกล่องให้ชัดที่สุด</p>
              <p>2. ถ้ามีแสงสะท้อน ให้ขยับมุมกล้องเล็กน้อยก่อนถ่าย</p>
              <p>3. ถ้า AI ยังไม่แน่ใจ ให้พิมพ์ชื่อยาหรือคำว่า ยาความดัน เพิ่มได้</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={(event) => submitScan(event, "medicine")}>
            <ImageSourcePicker
              label="รูปยาที่ต้องการสแกน"
              description="บนมือถือคุณสามารถเลือกได้ทั้งถ่ายรูปทันทีหรือเลือกรูปจากคลัง ส่วนบนคอมจะเปิดหน้าต่างเลือกรูปจากเครื่อง"
              selectedFileName={medicineFile?.name ?? null}
              onSelect={(file) => setMedicineFile(file)}
              onClear={() => setMedicineFile(null)}
              cameraLabel="ถ่ายรูปยา"
              libraryLabel="เลือกรูปยาจากคลัง"
            />

            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">
                ข้อความช่วย AI อ่านเพิ่ม
              </span>
              <Input
                name="hintText"
                placeholder="เช่น Prenolol 25mg / Amlodipine 5mg / ยาความดัน"
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
              disabled={isPending || activeScan === "medicine"}
              className="bg-slate-950 hover:bg-slate-800 focus-visible:outline-slate-900"
            >
              {activeScan === "medicine" || isPending
                ? "กำลังสแกนรูปยา..."
                : "สแกนรูปยา"}
            </Button>
          </form>
        </Card>
      ) : null}

      {showBloodPressure ? (
        <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.97)_100%)]">
          <div className="space-y-3">
            <CardTitle>สแกนค่าความดันจากรูป</CardTitle>
            <CardDescription>
              ถ่ายหน้าจอเครื่องวัดความดันหรือเลือกรูปเดิมจากคลัง แล้วให้ระบบลองอ่านค่าและบันทึกเข้าประวัติให้อัตโนมัติ
            </CardDescription>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-emerald-100 bg-emerald-50/70 p-5">
            <p className="text-base font-bold text-slate-950">ก่อนถ่ายรูปความดัน</p>
            <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
              <p>1. ถ่ายให้เห็นค่าบน ค่าล่าง และชีพจรในภาพเดียวกัน</p>
              <p>2. ถ้ารูปไม่คม ให้พิมพ์ค่าไว้ในช่องช่วย AI เช่น 124/74 pulse 64</p>
              <p>3. ถ้าระบบอ่านได้ ค่าจะถูกบันทึกลงประวัติให้อัตโนมัติ</p>
            </div>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => submitScan(event, "blood-pressure")}
          >
            <ImageSourcePicker
              label="รูปความดันที่ต้องการสแกน"
              description="เลือกรูปจากคลังได้ถ้ามีรูปเดิมอยู่แล้ว หรือถ่ายจากกล้องใหม่ได้ทันที"
              selectedFileName={pressureFile?.name ?? null}
              onSelect={(file) => setPressureFile(file)}
              onClear={() => setPressureFile(null)}
              cameraLabel="ถ่ายรูปความดัน"
              libraryLabel="เลือกรูปจากคลัง"
            />

            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">
                ข้อความช่วย AI อ่านเพิ่ม
              </span>
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

            <Button
              type="submit"
              fullWidth
              disabled={isPending || activeScan === "blood-pressure"}
            >
              {activeScan === "blood-pressure" || isPending
                ? "กำลังอ่านค่าความดัน..."
                : "สแกนความดันและบันทึก"}
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
