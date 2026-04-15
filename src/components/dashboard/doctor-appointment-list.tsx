"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatSystemDateTime } from "@/lib/date-time";
import { useState } from "react";

export function DoctorAppointmentList() {
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  const { data: appointments = [], refetch } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments?type=doctor");
      return res.json();
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
      setSelectedAppointment(null);
    },
  });

  const upcoming = appointments.filter((a) => {
    const date = new Date(a.appointmentDate);
    return date > new Date() && ["SCHEDULED", "RESCHEDULED"].includes(a.status);
  });

  const today = appointments.filter((a) => {
    const date = new Date(a.appointmentDate);
    const now = new Date();
    return (
      date.toDateString() === now.toDateString() &&
      ["SCHEDULED", "RESCHEDULED"].includes(a.status)
    );
  });

  return (
    <div className="space-y-6">
      {today.length > 0 && (
        <Card className="border-red-100 bg-red-50 p-6">
          <CardTitle className="flex items-center gap-2">
            🔔 วันนี้มีการนัด {today.length}
          </CardTitle>
          <div className="mt-4 space-y-2">
            {today.map((apt) => (
              <div
                key={apt.id}
                className="rounded-lg bg-white px-4 py-3 text-sm text-slate-700"
              >
                <p className="font-semibold">
                  {apt.elderly.firstName} {apt.elderly.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  เวลา: {formatSystemDateTime(new Date(apt.appointmentDate))}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="border-slate-200 p-6">
        <CardTitle>📅 รายการนัดหมายที่จะมา</CardTitle>
        <CardDescription className="mt-2">
          ไป{upcoming.length}รายการในการนัดหมายที่มากขึ้น
        </CardDescription>

        {upcoming.length === 0 ? (
          <div className="mt-4 rounded-lg border-2 border-dashed border-slate-300 py-8 text-center text-slate-500">
            ไม่มีการนัดหมายที่จะมา
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((apt) => (
              <button
                key={apt.id}
                onClick={() => setSelectedAppointment(apt.id)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  selectedAppointment === apt.id
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {apt.elderly.firstName} {apt.elderly.lastName}
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
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {apt.status === "SCHEDULED" ? "ตั้งแล้ว" : "เลื่อนแล้ว"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedAppointment && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <Button
              onClick={() => completeMutation.mutate(selectedAppointment)}
              disabled={completeMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {completeMutation.isPending ? "กำลังดำเนิน..." : "✅ ทำให้เสร็จ"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
