"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type UserRole = "ADMIN" | "DOCTOR" | "CAREGIVER" | "ELDERLY";

type ChatMessageView = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
};

type ChatPanelProps = {
  elderlyId: string;
  currentUserId: string;
  messages: ChatMessageView[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  placeholder?: string;
  notice?: string;
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "แอดมิน",
  DOCTOR: "คุณหมอ",
  CAREGIVER: "บัญชีเดิม",
  ELDERLY: "ผู้สูงอายุ",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ChatPanel({
  elderlyId,
  currentUserId,
  messages,
  title = "แชทของเคสนี้",
  description = "ใช้คุยกันระหว่างผู้สูงอายุ คุณหมอ และแอดมินภายในเคสเดียวกัน",
  emptyMessage = "ยังไม่มีข้อความในเคสนี้ เริ่มส่งข้อความแรกได้เลย",
  placeholder = "เช่น วันนี้รู้สึกเวียนหัวหลังวัดความดัน / อยากให้ช่วยดูรูปยาที่เพิ่งอัปโหลด",
  notice,
}: ChatPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      content: String(formData.get("content") ?? ""),
    };

    setError("");

    const response = await fetch(`/api/elderly/${elderlyId}/chat`, {
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
          : "ส่งข้อความไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
      return;
    }

    form.reset();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card className="border border-slate-200 bg-white">
      <div className="space-y-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>

      {notice ? (
        <div className="mt-5 rounded-[1.6rem] border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
          {notice}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {messages.length === 0 ? (
          <p className="rounded-[1.6rem] bg-slate-50 px-4 py-5 text-base leading-7 text-slate-500">
            {emptyMessage}
          </p>
        ) : null}

        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-[1.6rem] px-4 py-4 shadow-sm sm:max-w-[85%] ${
                  isOwnMessage ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
                }`}
              >
                <div
                  className={`flex flex-wrap items-center gap-2 text-xs ${
                    isOwnMessage ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  <span className="font-bold">{message.senderName}</span>
                  <span>{roleLabels[message.senderRole]}</span>
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
          <span className="text-sm font-bold text-slate-700">พิมพ์ข้อความ</span>
          <Textarea
            name="content"
            className="min-h-32"
            placeholder={placeholder}
            required
          />
        </label>

        {error ? (
          <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending} fullWidth>
          {isPending ? "กำลังส่งข้อความ..." : "ส่งข้อความ"}
        </Button>
      </form>
    </Card>
  );
}
