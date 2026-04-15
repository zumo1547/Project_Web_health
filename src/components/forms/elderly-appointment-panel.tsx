"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatSystemDateTime } from "@/lib/date-time";
import { RescheduleReason } from "@/generated/prisma";

interface ElderlyAppointmentPanelProps {
  elderlyId: string;
}

export function ElderlyAppointmentPanel({ elderlyId }: ElderlyAppointmentPanelProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", elderlyId],
    queryFn: async () => {
      const res = await fetch("/api/appointments?type=upcoming");
      return res.json();
    },
  });

  const reschedule = appointments.find((a) => a.id === selectedAppointment);

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/appointments?action=reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment,
          newDate,
          reason: rescheduleReason,
          reasonDetail: reasonDetail || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reschedule");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("✅ เลื่อนวันนัดสำเร็จแล้ว");
      setShowRescheduleForm(false);
      setNewDate("");
      setRescheduleReason("");
      setReasonDetail("");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message || "เกิดข้อผิดพลาด");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/appointments?action=cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment,
          cancellationReason: "ขอยกเลิกการนัด",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("✅ ยกเลิกการนัดแล้ว");
      setSelectedAppointment(null);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message || "เกิดข้อผิดพลาด");
    },
  });

  if (isLoading) {
    return <div className="text-center text-slate-500">กำลังโหลด...</div>;
  }

  if (appointments.length === 0) {
    return (
      <Card className="border-amber-100 bg-amber-50 p-6">
        <CardTitle>📅 การนัดหมาย</CardTitle>
        <p className="mt-4 text-sm text-slate-600">
          ยังไม่มีการนัดหมาย กรุณาติดต่อคุณหมอเพื่อสร้างวันนัด
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-blue-100 bg-blue-50 p-6">
      <CardTitle>📅 การนัดหมาย</CardTitle>
      <CardDescription className="mt-2">
        ดูวันนัดหมาย เลื่อนวัน หรือยกเลิกการนัด
      </CardDescription>

      <div className="mt-4 space-y-3">
        {appointments.map((apt) => (
          <button
            key={apt.id}
            onClick={() => setSelectedAppointment(apt.id)}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              selectedAppointment === apt.id
                ? "border-blue-500 bg-white shadow-md"
                : "border-blue-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  📅 {formatDate(new Date(apt.appointmentDate))}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  👨‍⚕️ {apt.doctor.name}
                </p>
                {apt.notes && (
                  <p className="mt-2 text-sm text-slate-700">💬 {apt.notes}</p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  apt.status === "SCHEDULED"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {apt.status === "SCHEDULED" ? "กำหนดแล้ว" : "เลื่อนแล้ว"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedAppointment && (
        <div className="mt-6 border-t border-blue-200 pt-6">
          {showRescheduleForm ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">เลื่อนวันการนัด</h3>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  วันและเวลาใหม่*
                </label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  เหตุผลการเลื่อน*
                </label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2"
                >
                  <option value="">เลือกเหตุผล</option>
                  <option value="ELDERLY_REQUEST">ตามคำขอของฉัน</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              {rescheduleReason === "OTHER" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โปรดระบุเหตุผล
                  </label>
                  <Textarea
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="กรุณาระบุเหตุผลการเลื่อนวัน"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => rescheduleMutation.mutate()}
                  disabled={rescheduleMutation.isPending || !newDate || !rescheduleReason}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {rescheduleMutation.isPending ? "กำลังเลื่อน..." : "ยืนยับการเลื่อน"}
                </Button>
                <Button
                  onClick={() => setShowRescheduleForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => setShowRescheduleForm(true)}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                🔄 เลื่อนวันการนัด
              </Button>
              <Button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {cancelMutation.isPending ? "กำลังยกเลิก..." : "❌ยกเลิกการนัด"}
              </Button>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}
    </Card>
  );
}
