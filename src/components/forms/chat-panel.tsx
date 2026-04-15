"use client";

import { formatSystemDateTime } from "@/lib/date-time";
import { readApiResponse } from "@/lib/client-image";
import { formatHospitalDistance } from "@/lib/hospital-map";
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
  hasActiveDoctor?: boolean;
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

type HospitalShareChatPayload = {
  type: "hospital-share";
  patientName: string;
  locationLabel: string | null;
  hospitals: Array<{
    id: string;
    name: string;
    address: string;
    distanceKm: number;
    mapUrl: string;
    directionsUrl: string;
  }>;
};

const HOSPITAL_SHARE_PREFIX = "[[HOSPITAL_SHARE]]";

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

function parseLegacyHospitalShareMessage(content: string): HospitalShareChatPayload | null {
  if (!content.includes("http") || !content.match(/^\d+\.\s+/m)) {
    return null;
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const patientName =
    lines[0]?.match(/สำหรับ\s+(.+)$/)?.[1]?.trim() ??
    lines[0]?.match(/for\s+(.+)$/i)?.[1]?.trim() ??
    "ผู้ป่วย";

  const locationLabel =
    lines
      .find(
        (line) => line.includes("ตำแหน่งล่าสุด") || line.includes("อ้างอิงจากตำแหน่ง"),
      )
      ?.split(":")
      .slice(1)
      .join(":")
      .trim() ?? null;

  const hospitals: HospitalShareChatPayload["hospitals"] = [];
  let currentEntry: string[] = [];

  function flushCurrentEntry() {
    if (!currentEntry.length) {
      return;
    }

    const headerMatch = currentEntry[0].match(/^\d+\.\s*(.+?)(?:\s*\(([^)]+)\))?$/);
    if (!headerMatch) {
      currentEntry = [];
      return;
    }

    const urls = currentEntry
      .flatMap((line) => line.match(/https?:\/\/\S+/g) ?? [])
      .filter(Boolean);

    const mapUrl = urls.find((url) => !url.includes("/maps/dir/")) ?? urls[0] ?? "";
    const directionsUrl =
      urls.find((url) => url.includes("/maps/dir/")) ?? mapUrl;

    const address =
      currentEntry
        .find((line) => line.startsWith("ที่อยู่:"))
        ?.replace(/^ที่อยู่:\s*/, "")
        .trim() ??
      currentEntry.find(
        (line) =>
          !line.includes("http") &&
          !/^\d+\./.test(line) &&
          !line.includes("แผนที่") &&
          !line.includes("เส้นทาง"),
      ) ??
      "";

    const distanceText = headerMatch[2] ?? "";
    const kmMatch = distanceText.match(/([\d.]+)\s*(กม\.|km)/i);
    const meterMatch = distanceText.match(/(\d+)\s*(เมตร|m)/i);
    const distanceKm = kmMatch
      ? Number(kmMatch[1])
      : meterMatch
        ? Number(meterMatch[1]) / 1000
        : 0;

    hospitals.push({
      id: `${headerMatch[1]}-${distanceText || "shared"}`,
      name: headerMatch[1].trim(),
      address,
      distanceKm,
      mapUrl,
      directionsUrl,
    });

    currentEntry = [];
  }

  for (const line of lines) {
    if (/^\d+\.\s+/.test(line)) {
      flushCurrentEntry();
      currentEntry = [line];
      continue;
    }

    if (currentEntry.length) {
      currentEntry.push(line);
    }
  }

  flushCurrentEntry();

  if (!hospitals.length) {
    return null;
  }

  return {
    type: "hospital-share",
    patientName,
    locationLabel,
    hospitals: hospitals.slice(0, 3),
  };
}

function parseHospitalShareMessage(content: string): HospitalShareChatPayload | null {
  if (content.startsWith(HOSPITAL_SHARE_PREFIX)) {
    try {
      const payload = JSON.parse(
        content.slice(HOSPITAL_SHARE_PREFIX.length),
      ) as HospitalShareChatPayload;

      if (
        payload.type === "hospital-share" &&
        Array.isArray(payload.hospitals) &&
        payload.hospitals.length
      ) {
        return payload;
      }
    } catch (error) {
      console.error("CHAT_HOSPITAL_SHARE_PARSE_ERROR", error);
    }
  }

  return parseLegacyHospitalShareMessage(content);
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
  hasActiveDoctor = false,
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
          const hospitalShare = parseHospitalShareMessage(message.content);

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
                {hospitalShare ? (
                  <div className="mt-3 space-y-3">
                    <div
                      className={`rounded-[1.3rem] border px-3 py-3 ${
                        isOwnMessage
                          ? "border-white/15 bg-white/5"
                          : "border-emerald-100 bg-emerald-50"
                      }`}
                    >
                      <p className="text-sm font-bold">
                        โรงพยาบาลใกล้คุณ {hospitalShare.patientName}
                      </p>
                      <p
                        className={`mt-1 text-sm leading-6 ${
                          isOwnMessage ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {hospitalShare.locationLabel
                          ? `อ้างอิงจาก: ${hospitalShare.locationLabel}`
                          : "ใช้ตำแหน่งล่าสุดของผู้ป่วยในการค้นหา"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {hospitalShare.hospitals.map((hospital, index) => (
                        <div
                          key={`${message.id}-${hospital.id}-${index}`}
                          className={`rounded-[1.25rem] border px-3 py-3 ${
                            isOwnMessage
                              ? "border-white/12 bg-white/5"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold leading-6">{hospital.name}</p>
                              {hospital.address ? (
                                <p
                                  className={`mt-1 text-sm leading-6 ${
                                    isOwnMessage ? "text-slate-300" : "text-slate-600"
                                  }`}
                                >
                                  {hospital.address}
                                </p>
                              ) : null}
                            </div>
                            <div
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                isOwnMessage
                                  ? "bg-emerald-500/15 text-emerald-200"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {formatHospitalDistance(hospital.distanceKm)}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <a
                              href={hospital.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex min-h-[2.5rem] items-center justify-center rounded-[1rem] border px-3 py-2 text-sm font-bold transition ${
                                isOwnMessage
                                  ? "border-white/15 bg-white/8 text-white hover:bg-white/12"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              ดูแผนที่
                            </a>
                            <a
                              href={hospital.directionsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex min-h-[2.5rem] items-center justify-center rounded-[1rem] border px-3 py-2 text-sm font-bold transition ${
                                isOwnMessage
                                  ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-200 hover:bg-emerald-500/18"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              }`}
                            >
                              เปิดเส้นทาง
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-base leading-7">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hasActiveDoctor ? (
        <div className="mt-6 rounded-[1.6rem] border border-amber-100 bg-amber-50/70 p-5">
          <p className="text-base font-bold text-slate-950">⚠️ ต้องขอหมอรับเคสก่อน</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            ในการแชทกับหมอ คุณต้องส่งคำขอให้หมอรับเคสก่อน เมื่อหมอรับเคสแล้ว คุณจึงจะสามารถแชทได้
          </p>
        </div>
      ) : (
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
      )}
    </Card>
  );
}
