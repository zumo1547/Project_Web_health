"use client";

import { formatSystemDateTime } from "@/lib/date-time";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type AiHealthChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

type AiHealthChatPanelProps = {
  elderlyId: string;
  messages: AiHealthChatMessage[];
};

function formatDate(value: string) {
  return formatSystemDateTime(value, true);
}

export function AiHealthChatPanel({
  elderlyId,
  messages,
}: AiHealthChatPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");

    const response = await fetch(`/api/elderly/${elderlyId}/ai-health-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: String(formData.get("content") ?? ""),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        typeof result.error === "string"
          ? result.error
          : "ยังไม่สามารถคุยกับ AI ได้ในขณะนี้",
      );
      return;
    }

    form.reset();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.96)_100%)]">
      <div className="space-y-3">
        <CardTitle>คุยกับ AI เรื่องสุขภาพ</CardTitle>
        <CardDescription>
          ใช้ถามเรื่องยา ความดัน หรือสรุปสิ่งที่บันทึกไว้ในระบบได้ทันทีตลอดเวลา
        </CardDescription>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-cyan-100 bg-cyan-50/70 p-5">
        <p className="text-base font-bold text-slate-950">ตัวอย่างคำถามที่ถามได้ทันที</p>
        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
          <p>1. ความดันล่าสุดของฉันอยู่ในระดับไหน</p>
          <p>2. ยาที่อัปโหลดล่าสุดใช้ทำอะไร</p>
          <p>3. สรุปสิ่งที่ฉันบันทึกไว้วันนี้ให้หน่อย</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {messages.length === 0 ? (
          <p className="rounded-[1.6rem] bg-white/80 px-4 py-5 text-base leading-7 text-slate-500">
            ยังไม่มีประวัติการคุยกับ AI ลองถามเรื่องความดัน ยา หรืออาการที่กังวลได้เลย
          </p>
        ) : null}

        {messages.map((message) => {
          const isAssistant = message.role === "ASSISTANT";

          return (
            <div
              key={message.id}
              className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[92%] rounded-[1.6rem] px-4 py-4 shadow-sm sm:max-w-[85%] ${
                  isAssistant ? "bg-white text-slate-900" : "bg-slate-950 text-white"
                }`}
              >
                <div
                  className={`flex flex-wrap items-center gap-2 text-xs ${
                    isAssistant ? "text-slate-500" : "text-slate-300"
                  }`}
                >
                  <span className="font-bold">{isAssistant ? "AI สุขภาพ" : "คุณ"}</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-base leading-7">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-700">พิมพ์คำถามถึง AI</span>
          <Textarea
            name="content"
            className="min-h-28"
            placeholder="เช่น ช่วยอธิบายค่าความดันล่าสุดของฉันให้เข้าใจง่าย ๆ"
            required
          />
        </label>

        {error ? (
          <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending} fullWidth>
          {isPending ? "กำลังถาม AI..." : "ส่งคำถามถึง AI"}
        </Button>
      </form>
    </Card>
  );
}
