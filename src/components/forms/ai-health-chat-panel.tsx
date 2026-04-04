"use client";

import { fetchWithTimeout, readApiResponse } from "@/lib/client-image";
import { formatSystemDateTime } from "@/lib/date-time";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";

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

const AI_CHAT_TIMEOUT_MS = 30000;
const QUICK_PROMPTS = [
  "ความดันล่าสุดของฉันอยู่ในระดับไหน",
  "ยาที่อัปโหลดล่าสุดใช้ทำอะไร",
  "สรุปสิ่งที่บันทึกวันนี้ให้หน่อย",
];

function formatDate(value: string) {
  return formatSystemDateTime(value, true);
}

export function AiHealthChatPanel({
  elderlyId,
  messages,
}: AiHealthChatPanelProps) {
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState(messages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    setError("");

    if (!content) {
      setError("กรุณาพิมพ์คำถามก่อนส่ง");
      return;
    }

    try {
      const response = await fetchWithTimeout(
        `/api/elderly/${elderlyId}/ai-health-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        },
        AI_CHAT_TIMEOUT_MS,
      );

      const result = await readApiResponse(response);

      if (!response.ok) {
        setError(
          result &&
            typeof result === "object" &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "ยังไม่สามารถคุยกับ AI ได้ในขณะนี้",
        );
        return;
      }

      const payload = result as {
        userMessage?: AiHealthChatMessage;
        aiMessage?: AiHealthChatMessage;
      };

      setDraft("");

      if (payload.userMessage && payload.aiMessage) {
        setChatMessages((current) => [
          ...current,
          payload.userMessage as AiHealthChatMessage,
          payload.aiMessage as AiHealthChatMessage,
        ]);
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      console.error("AI_HEALTH_CHAT_FORM_ERROR", submitError);
      setError("ยังไม่สามารถคุยกับ AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  return (
    <Card className="border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.96)_100%)]">
      <div className="space-y-3">
        <CardTitle>คุยกับ AI เรื่องสุขภาพ</CardTitle>
        <CardDescription>
          ใช้ถามเรื่องยา ความดัน หรือขอให้ AI ช่วยสรุปข้อมูลสุขภาพจากสิ่งที่บันทึกไว้ในระบบแบบอ่านง่าย
        </CardDescription>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-[1.6rem] border border-cyan-100 bg-cyan-50/70 p-5">
          <p className="text-base font-bold text-slate-950">ถามแบบสั้น ๆ ได้เลย</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            หากไม่แน่ใจว่าจะเริ่มถามอย่างไร ลองกดคำถามตัวอย่างด้านล่างได้ทันที
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="ghost"
                className="rounded-full border border-cyan-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-cyan-50"
                onClick={() => setDraft(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">ห้องคุยกับ AI</p>
              <p className="text-sm text-slate-500">
                ตอบกลับจากข้อมูลสุขภาพล่าสุดที่มีอยู่ในระบบ
              </p>
            </div>
            <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
              พร้อมช่วยสรุป
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="mt-4 space-y-3 overflow-y-auto pr-1 max-h-[26rem]"
          >
            {chatMessages.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-base leading-7 text-slate-500">
                ยังไม่มีประวัติการคุยกับ AI ลองถามเรื่องความดัน ยา หรือขอให้ AI
                สรุปข้อมูลวันนี้ให้แบบเข้าใจง่ายได้เลย
              </div>
            ) : null}

            {chatMessages.map((message) => {
              const isAssistant = message.role === "ASSISTANT";

              return (
                <div
                  key={message.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[95%] rounded-[1.6rem] px-4 py-4 shadow-sm sm:max-w-[85%] ${
                      isAssistant
                        ? "border border-slate-100 bg-white text-slate-900"
                        : "bg-slate-950 text-white"
                    }`}
                  >
                    <div
                      className={`flex flex-wrap items-center gap-2 text-xs ${
                        isAssistant ? "text-slate-500" : "text-slate-300"
                      }`}
                    >
                      <span className="font-bold">
                        {isAssistant ? "AI สุขภาพ" : "คุณ"}
                      </span>
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
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-700">พิมพ์คำถามถึง AI</span>
          <Textarea
            name="content"
            className="min-h-28"
            placeholder="เช่น ช่วยอธิบายค่าความดันล่าสุดของฉันให้เข้าใจง่าย หรือยาที่อัปโหลดล่าสุดใช้ทำอะไร"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            required
          />
        </label>

        {error ? (
          <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending || !draft.trim()} fullWidth>
          {isPending ? "กำลังถาม AI..." : "ส่งคำถามถึง AI"}
        </Button>
      </form>
    </Card>
  );
}
