"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatSystemDateTime } from "@/lib/date-time";
import { useState } from "react";

export function DoctorAppointmentList() {
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data: appointments = [], refetch } = useQuery<any[]>({
    queryKey: ["doctor-appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments?type=doctor");
      return res.json();
    },
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["appointment-history"],
    enabled: showHistory,
    queryFn: async () => {
      const res = await fetch("/api/appointments/history");
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

  const updateMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch("/api/appointments?action=update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          appointmentDate: editDate,
          notes: editNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setEditingAppointmentId(null);
      setEditDate("");
      setEditNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch("/api/appointments?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }
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

  const selectedApt = appointments.find((a) => a.id === selectedAppointment);
  const isEditing = editingAppointmentId === selectedAppointment;

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
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            {isEditing ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">แก้ไขการนัด</h3>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    วันและเวลา
                  </label>
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    หมายเหตุ
                  </label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => updateMutation.mutate(selectedAppointment)}
                    disabled={updateMutation.isPending || !editDate}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {updateMutation.isPending ? "กำลังบันทึก..." : "💾 บันทึก"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingAppointmentId(null);
                      setEditDate("");
                      setEditNotes("");
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-900">
                    <strong>ผู้ป่วย:</strong> {selectedApt?.elderly.firstName} {selectedApt?.elderly.lastName}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">
                    <strong>วันนัด:</strong> {formatSystemDateTime(new Date(selectedApt?.appointmentDate))}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">
                    <strong>สถานะ:</strong> {selectedApt?.status === "SCHEDULED" ? "ตั้งแล้ว" : "เลื่อนแล้ว"}
                  </p>
                  {selectedApt?.notes && (
                    <p className="mt-2 text-sm text-slate-900">
                      <strong>หมายเหตุ:</strong> {selectedApt.notes}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      setEditingAppointmentId(selectedAppointment);
                      setEditDate(selectedApt?.appointmentDate?.slice(0, 16) || "");
                      setEditNotes(selectedApt?.notes || "");
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ✏️ แก้ไข
                  </Button>
                  <Button
                    onClick={() => completeMutation.mutate(selectedAppointment)}
                    disabled={completeMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {completeMutation.isPending ? "กำลัง..." : "✅ เสร็จ"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm("แน่ใจว่าต้องการลบการนัดนี้?")) {
                        deleteMutation.mutate(selectedAppointment);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="col-span-2 bg-red-600 hover:bg-red-700"
                  >
                    {deleteMutation.isPending ? "กำลังลบ..." : "🗑️ ลบการนัด"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-4">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="secondary"
            className="w-full"
          >
            {showHistory ? "ซ่อนประวัติ" : "📋 ดูประวัติการนัด"}
          </Button>

          {showHistory && history.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-slate-900">ประวัติการนัด</h3>
              {history.map((hist) => (
                <div
                  key={hist.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">
                    {hist.elderly?.firstName} {hist.elderly?.lastName}
                  </p>
                  <p className="text-slate-600">
                    📅 {formatDate(new Date(hist.appointmentDate))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ✓ เสร็จแล้ว
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
