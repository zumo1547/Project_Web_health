"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { createAppointmentSchema } from "@/lib/validations";
import { formatDate, formatSystemDateTime } from "@/lib/date-time";

interface DoctorAppointmentFormProps {
  elderlyId: string;
  elderlyName: string;
  onSuccess?: () => void;
}

export function DoctorAppointmentForm({
  elderlyId,
  elderlyName,
  onSuccess,
}: DoctorAppointmentFormProps) {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/appointments?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elderlyId,
          appointmentDate,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create appointment");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("✅ นัดหมายสำเร็จแล้ว");
      setAppointmentDate("");
      setNotes("");
      setError("");
      onSuccess?.();
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message || "เกิดข้อผิดพลาด");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      createAppointmentSchema.parse({
        elderlyId,
        appointmentDate,
        notes,
      });
      mutation.mutate();
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "ข้อมูลไม่ถูกต้อง");
    }
  };

  return (
    <Card className="border-blue-100 bg-blue-50 p-6">
      <CardTitle className="mb-4">🗓️ สร้างนัดหมาย</CardTitle>
      <CardDescription className="mb-4">
        สแคนหมายเหตุสั้นๆ เกี่ยวกับเหตุผลของการนัดและวันที่ต้องการให้ผู้สูงอายุมา
      </CardDescription>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            ชื่อผู้สูงอายุ
          </label>
          <div className="mt-1 rounded-lg bg-white px-3 py-2 text-slate-600">
            {elderlyName}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">
            วันและเวลาที่นัด*
          </label>
          <Input
            type="datetime-local"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
            className="mt-1"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">
            หมายเหตุและคำแนะนำ (ตัวเลือก)
          </label>
          <Textarea
            placeholder="เช่น เตรียมผลตรวจสุขภาพ หรือ ควรหลีกเลี่ยงอาหารหนัก 3 ชั่วโมงก่อน"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {mutation.isPending ? "กำลังสร้าง..." : "สร้างนัดหมาย"}
        </Button>
      </form>
    </Card>
  );
}
