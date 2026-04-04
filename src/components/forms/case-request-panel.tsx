"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCaseStatusContent } from "@/lib/health-presenters";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type CaseRequestPanelProps = {
  elderlyId: string;
  caseStatus: "SELF_SERVICE" | "WAITING_DOCTOR" | "IN_REVIEW" | "COMPLETED";
  doctorRequestNote?: string | null;
  doctorRequestedAt?: string | null;
  doctorNames: string[];
};

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CaseRequestPanel({
  elderlyId,
  caseStatus,
  doctorRequestNote,
  doctorRequestedAt,
  doctorNames,
}: CaseRequestPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const content = getCaseStatusContent(caseStatus);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");

    const response = await fetch(`/api/elderly/${elderlyId}/case-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "REQUEST_DOCTOR",
        requestNote: String(formData.get("requestNote") ?? ""),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        typeof result.error === "string"
          ? result.error
          : "ยังไม่สามารถส่งคำขอให้คุณหมอรับเคสได้",
      );
      return;
    }

    form.reset();
    startTransition(() => {
      router.refresh();
    });
  }

  async function switchToSelfService() {
    setError("");

    const response = await fetch(`/api/elderly/${elderlyId}/case-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "SET_SELF_SERVICE",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        typeof result.error === "string"
          ? result.error
          : "ยังไม่สามารถเปลี่ยนกลับเป็นโหมดใช้งานด้วยตัวเองได้",
      );
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card className="border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.95)_100%)]">
      <div className="space-y-3">
        <CardTitle>สถานะการขอคุณหมอรับเคส</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </div>

      <div className="mt-6 rounded-[1.6rem] bg-white/85 p-5">
        <p className="text-lg font-extrabold text-slate-950">{content.label}</p>
        {doctorNames.length ? (
          <p className="mt-3 text-base leading-7 text-slate-600">
            คุณหมอที่กำลังดูแล: {doctorNames.join(", ")}
          </p>
        ) : null}
        {doctorRequestNote ? (
          <p className="mt-2 text-base leading-7 text-slate-600">
            เรื่องที่แจ้งไว้: {doctorRequestNote}
          </p>
        ) : null}
        {doctorRequestedAt ? (
          <p className="mt-2 text-sm text-slate-500">
            ส่งคำขอเมื่อ {formatDate(doctorRequestedAt)}
          </p>
        ) : null}
      </div>

      {(caseStatus === "SELF_SERVICE" || caseStatus === "COMPLETED") ? (
        <form className="mt-6 space-y-4" onSubmit={handleRequest}>
          <div className="rounded-[1.6rem] border border-amber-100 bg-amber-50/70 p-5">
            <p className="text-base font-bold text-slate-950">พิมพ์เรื่องที่อยากให้คุณหมอช่วยดู</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              ระบุอาการ ปัญหาที่กังวล หรือสิ่งที่อยากให้ช่วยตรวจ เช่น รูปยา ค่าความดัน หรืออาการเวียนหัว
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">ข้อความถึงคุณหมอ</span>
            <Textarea
              name="requestNote"
              className="min-h-28"
              placeholder="เช่น วันนี้วัดความดันแล้วสูงกว่าปกติ อยากให้ช่วยดูรูปยาที่กินอยู่ด้วย"
            />
          </label>

          {error ? (
            <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending} fullWidth>
            {isPending ? "กำลังส่งคำขอ..." : "ขอให้คุณหมอรับเคส"}
          </Button>
        </form>
      ) : null}

      {caseStatus === "WAITING_DOCTOR" ? (
        <div className="mt-6 space-y-3">
          {error ? (
            <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <Button variant="secondary" disabled={isPending} onClick={switchToSelfService} fullWidth>
            {isPending ? "กำลังอัปเดต..." : "กลับไปใช้งานด้วยตัวเองก่อน"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
