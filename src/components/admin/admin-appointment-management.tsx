"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/date-time";
import { AppointmentStatus, Appointment } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";

export function AdminAppointmentManagement() {
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [activeAppointment, setActiveAppointment] = useState<string | null>(null);

  const { data: appointments = [], refetch } = useQuery<any[]>({
    queryKey: ["appointments", "all"],
    queryFn: async () => {
      const res = await fetch("/api/appointments?type=all");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch("/api/appointments?action=cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          cancellationReason: "ยกเลิกโดยแอดมิน",
        }),
      });

      if (!response.ok) throw new Error("Failed to cancel");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setActiveAppointment(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch("/api/appointments?action=complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) throw new Error("Failed to complete");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setActiveAppointment(null);
    },
  });

  const filtered = appointments.filter(
    (apt) => filterStatus === "ALL" || apt.status === filterStatus
  );

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "SCHEDULED").length,
    rescheduled: appointments.filter((a) => a.status === "RESCHEDULED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-6">
      <Card className="border-indigo-100 bg-indigo-50 p-6">
        <CardTitle>📊 สรุปการนัดหมาย</CardTitle>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg bg-white p-3">
            <p className="text-sm text-slate-600">ทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-green-100 p-3">
            <p className="text-sm text-green-700">ตั้งแล้ว</p>
            <p className="text-2xl font-bold text-green-900">{stats.scheduled}</p>
          </div>
          <div className="rounded-lg bg-amber-100 p-3">
            <p className="text-sm text-amber-700">เลื่อนแล้ว</p>
            <p className="text-2xl font-bold text-amber-900">{stats.rescheduled}</p>
          </div>
          <div className="rounded-lg bg-blue-100 p-3">
            <p className="text-sm text-blue-700">สำเร็จ</p>
            <p className="text-2xl font-bold text-blue-900">{stats.completed}</p>
          </div>
          <div className="rounded-lg bg-red-100 p-3">
            <p className="text-sm text-red-700">ยกเลิก</p>
            <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
          </div>
        </div>
      </Card>

      <Card className="border-slate-200 p-6">
        <CardTitle>📋 รายการนัดหมาย</CardTitle>
        <CardDescription className="mt-2">
          ดูและจัดการการนัดหมายทั้งหมดในระบบ
        </CardDescription>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {(["ALL", "SCHEDULED", "RESCHEDULED", "COMPLETED", "CANCELLED"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  filterStatus === status
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {status === "ALL"
                  ? "ทั้งหมด"
                  : status === "SCHEDULED"
                  ? "ตั้งแล้ว"
                  : status === "RESCHEDULED"
                  ? "เลื่อนแล้ว"
                  : status === "COMPLETED"
                  ? "สำเร็จ"
                  : "ยกเลิก"}
              </button>
            )
          )}
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-300 py-8 text-center">
              <p className="text-slate-500">ไม่มีการนัดหมายในหมวดหมู่นี้</p>
            </div>
          ) : (
            filtered.map((apt) => (
              <button
                key={apt.id}
                onClick={() => setActiveAppointment(apt.id)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  activeAppointment === apt.id
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {apt.elderly.firstName} {apt.elderly.lastName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      👨‍⚕️ {apt.doctor.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      📅 {formatDate(new Date(apt.appointmentDate))}
                    </p>
                    {apt.elderly.phone && (
                      <p className="mt-1 text-sm text-slate-600">
                        📱 {apt.elderly.phone}
                      </p>
                    )}
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      apt.status === "SCHEDULED"
                        ? "bg-green-100 text-green-700"
                        : apt.status === "RESCHEDULED"
                        ? "bg-amber-100 text-amber-700"
                        : apt.status === "COMPLETED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {apt.status === "SCHEDULED"
                      ? "ตั้งแล้ว"
                      : apt.status === "RESCHEDULED"
                      ? "เลื่อนแล้ว"
                      : apt.status === "COMPLETED"
                      ? "สำเร็จ"
                      : "ยกเลิก"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {activeAppointment && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              {["SCHEDULED", "RESCHEDULED"].includes(
                filtered.find((a) => a.id === activeAppointment)?.status || ""
              ) && (
                <>
                  <Button
                    onClick={() => completeMutation.mutate(activeAppointment)}
                    disabled={completeMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {completeMutation.isPending ? "กำลังดำเนิน..." : "✅ ทำให้เสร็จ"}
                  </Button>
                  <Button
                    onClick={() => cancelMutation.mutate(activeAppointment)}
                    disabled={cancelMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {cancelMutation.isPending ? "กำลังยกเลิก..." : "❌ ยกเลิก"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
