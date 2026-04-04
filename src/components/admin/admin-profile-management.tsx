"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatSystemDateTime } from "@/lib/date-time";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminProfileRow = {
  id: string;
  fullName: string;
  updatedAt: string;
  doctorNames: string[];
  elderlyEmail: string | null;
  caseStatus: "SELF_SERVICE" | "WAITING_DOCTOR" | "IN_REVIEW" | "COMPLETED";
};

type AdminProfileManagementProps = {
  profiles: AdminProfileRow[];
};

function formatDate(value: string) {
  return formatSystemDateTime(value);
}

const statusLabels: Record<AdminProfileRow["caseStatus"], string> = {
  SELF_SERVICE: "ใช้งานด้วยตัวเอง",
  WAITING_DOCTOR: "รอคุณหมอรับเคส",
  IN_REVIEW: "มีคุณหมอดูแล",
  COMPLETED: "ปิดเคสแล้ว",
};

export function AdminProfileManagement({
  profiles,
}: AdminProfileManagementProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function deleteProfile(profileId: string) {
    const confirmed = window.confirm(
      "ต้องการลบแฟ้มผู้สูงอายุนี้ใช่หรือไม่? ประวัติความดัน รูปยา ผล AI และแชทจะถูกลบไปด้วย",
    );
    if (!confirmed) return;

    setPendingId(profileId);
    setError("");

    const response = await fetch(`/api/admin/elderly/${profileId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      setError(typeof result.error === "string" ? result.error : "ลบเคสไม่สำเร็จ");
      setPendingId(null);
      return;
    }

    setPendingId(null);
    router.refresh();
  }

  return (
    <Card>
      <div className="space-y-3">
        <CardTitle>ลบข้อมูลที่ไม่ใช้แล้ว</CardTitle>
        <CardDescription>
          ใช้ลบแฟ้มผู้สูงอายุที่ไม่ต้องการเก็บต่อ เพื่อให้ข้อมูลในระบบไม่ซ้ำซ้อนและจัดการได้ง่าย
        </CardDescription>
      </div>

      {error ? (
        <p className="mt-5 rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-extrabold text-slate-950">{profile.fullName}</p>
                  <Badge
                    tone={
                      profile.caseStatus === "IN_REVIEW"
                        ? "emerald"
                        : profile.caseStatus === "WAITING_DOCTOR"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {statusLabels[profile.caseStatus]}
                  </Badge>
                  {profile.elderlyEmail ? (
                    <Badge tone="emerald">ผูกบัญชีแล้ว</Badge>
                  ) : (
                    <Badge tone="amber">ยังไม่ผูกบัญชี</Badge>
                  )}
                </div>
                <p className="text-base text-slate-600">
                  บัญชีผู้สูงอายุ: {profile.elderlyEmail ?? "ยังไม่เชื่อม"}
                </p>
                <p className="text-base text-slate-600">
                  คุณหมอ: {profile.doctorNames.length ? profile.doctorNames.join(", ") : "ยังไม่มี"}
                </p>
                <p className="text-sm text-slate-500">
                  อัปเดตล่าสุด {formatDate(profile.updatedAt)}
                </p>
              </div>

              <Button
                variant="danger"
                disabled={pendingId === profile.id}
                onClick={() => deleteProfile(profile.id)}
              >
                ลบเคสนี้
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
