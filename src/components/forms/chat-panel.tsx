"use client";

import { formatSystemDateTime } from "@/lib/date-time";
import { readApiResponse } from "@/lib/client-image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";

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

type ApiChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderRole: UserRole;
  sender: {
    id: string;
    name: string;
    role: UserRole;
  };
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "แอดมิน",
  DOCTOR: "คุณหมอ",
  CAREGIVER: "บัญชีเดิม",
  ELDERLY: "ผู้สูงอายุ",
};

function formatDate(value: string) {
  return formatSystemDateTime(value, true);
}

function mapApiMessageToView(message: ApiChatMessage): ChatMessageView {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    senderId: message.sender.id ?? message.senderId,
    senderName: message.sender.name,
    senderRole: message.sender.role ?? message.senderRole,
  };
}

function areMessagesEqual(left: ChatMessageView[], right: ChatMessageView[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((message, index) => {
    const target = right[index];

    return (
      message.id === target.id &&
      message.content === target.content &&
      message.createdAt === target.createdAt &&
      message.senderId === target.senderId &&
      message.senderRole === target.senderRole &&
      message.senderName === target.senderName
    );
  });
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
  const [chatMessages, setChatMessages] = useState(messages);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function refreshMessages() {
      try {
        const response = await fetch(`/api/elderly/${elderlyId}/chat`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const result = (await readApiResponse(response)) as ApiChatMessage[];
        if (cancelled || !Array.isArray(result)) {
          return;
        }

        const nextMessages = result.map(mapApiMessageToView);
        setChatMessages((current) =>
          areMessagesEqual(current, nextMessages) ? current : nextMessages,
        );
      } catch (fetchError) {
        console.error("CHAT_REFRESH_ERROR", fetchError);
      }
    }

    void refreshMessages();
    const timer = window.setInterval(() => {
      void refreshMessages();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [elderlyId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      content: String(formData.get("content") ?? ""),
    };

    setError("");

    let response: Response;
    let result: unknown;

    try {
      response = await fetch(`/api/elderly/${elderlyId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      result = await readApiResponse(response);
    } catch (submitError) {
      console.error("CHAT_SUBMIT_ERROR", submitError);
      setError("ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    if (!response.ok) {
      setError(
        result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
      return;
    }

    if (result && typeof result === "object" && "sender" in result && "id" in result) {
      setChatMessages((current) => [
        ...current,
        mapApiMessageToView(result as ApiChatMessage),
      ]);
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
        {chatMessages.length === 0 ? (
          <p className="rounded-[1.6rem] bg-slate-50 px-4 py-5 text-base leading-7 text-slate-500">
            {emptyMessage}
          </p>
        ) : null}

        {chatMessages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;

          return (
            <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
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
