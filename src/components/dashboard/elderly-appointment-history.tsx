"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/date-time";

interface ElderlyAppointmentHistoryProps {
  elderlyId: string;
}

export function ElderlyAppointmentHistory({ elderlyId }: ElderlyAppointmentHistoryProps) {
  const { data: history = [], isLoading } = useQuery<any[]>({
    queryKey: ["appointment-history", elderlyId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments/history?elderlyId=${elderlyId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="text-center text-slate-500">กำลังโหลด...</div>;
  }

  if (history.length === 0) {
    return (
      <Card className="border-slate-200 p-6">
        <CardTitle>📚 ประวัติการนัด</CardTitle>
        <p className="mt-4 text-sm text-slate-600">
          ยังไม่มีประวัติการนัดที่เสร็จสิ้น
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 p-6">
      <CardTitle>📚 ประวัติการนัด</CardTitle>
      <CardDescription className="mt-2">
        ประวัติการนัดที่เสร็จสิ้นจะอยู่ในแฟ้มของคุณ
      </CardDescription>

      <div className="mt-4 space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  👨‍⚕️ {item.doctor.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  📅 {formatDate(new Date(item.appointmentDate))}
                </p>
                {item.notes && (
                  <p className="mt-2 text-sm text-slate-700">💬 {item.notes}</p>
                )}
                {item.completedAt && (
                  <p className="mt-2 text-xs text-green-600">
                    ✅ เสร็จสิ้นเมื่อ {formatDate(new Date(item.completedAt))}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
