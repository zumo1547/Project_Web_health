"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatSystemDateTime } from "@/lib/date-time";

interface AppointmentChatIntegrationProps {
  elderlyId: string;
  doctorId: string;
  appointmentId: string;
  appointmentDate: Date;
  doctorName: string;
}

export function AppointmentChatIntegration({
  elderlyId,
  doctorId,
  appointmentId,
  appointmentDate,
  doctorName,
}: AppointmentChatIntegrationProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      // Call the existing chat API or create a new message in ChatMessage table
      const response = await fetch("/api/elderly/[id]/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elderlyId,
          content: message,
          linkedAppointmentId: appointmentId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("✅ ส่งข้อความแล้ว");
      setMessage("");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message || "เกิดข้อผิดพลาด");
    },
  });

  return (
    <Card className="border-purple-100 bg-purple-50 p-4">
      <CardTitle className="text-sm">💬 ส่งข้อความเกี่ยวกับการนัดนี้</CardTitle>
      <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-600">
        <p>📅 {formatDate(appointmentDate)}</p>
        <p>👨‍⚕️ {doctorName}</p>
      </div>

      <Textarea
        placeholder="โปรดเขียนข้อความเกี่ยวกับการนัด เช่น คำถาม หรือข้อมูลเพิ่มเติม"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="mt-3"
      />

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      )}

      <Button
        onClick={() => sendMessageMutation.mutate()}
        disabled={sendMessageMutation.isPending || !message.trim()}
        className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        {sendMessageMutation.isPending ? "กำลังส่ง..." : "ส่งข้อความ"}
      </Button>
    </Card>
  );
}
