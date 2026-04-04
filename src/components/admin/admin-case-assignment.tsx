"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type DoctorOption = {
  id: string;
  name: string;
  email: string;
};

type ProfileAssignmentRow = {
  id: string;
  fullName: string;
  caseStatus: "SELF_SERVICE" | "WAITING_DOCTOR" | "IN_REVIEW" | "COMPLETED";
  doctorRequestNote?: string | null;
  doctors: DoctorOption[];
};

type AdminCaseAssignmentProps = {
  doctors: DoctorOption[];
  profiles: ProfileAssignmentRow[];
};

const statusLabels: Record<ProfileAssignmentRow["caseStatus"], string> = {
  SELF_SERVICE: "ใช้งานด้วยตัวเอง",
  WAITING_DOCTOR: "รอคุณหมอรับเคส",
  IN_REVIEW: "มีคุณหมอดูแลอยู่",
  COMPLETED: "ปิดเคสแล้ว",
};

export function AdminCaseAssignment({
  doctors,
  profiles,
}: AdminCaseAssignmentProps) {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const defaultDoctorMap = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((profile) => [profile.id, profile.doctors[0]?.id ?? ""]),
      ),
    [profiles],
  );

  async function runAction(
    elderlyId: string,
    payload: Record<string, string | undefined>,
  ) {
    setError("");

    const response = await fetch(`/api/elderly/${elderlyId}/case-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(typeof result.error === "string" ? result.error : "อัปเดตเคสไม่สำเร็จ");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="space-y-3">
        <CardTitle>จับคู่หมอกับผู้สูงอายุ</CardTitle>
        <CardDescription>
          เลือกคุณหมอให้แต่ละเคส ยกเลิกการดูแล หรือเปิดเคสกลับไปรอคุณหมอคนใหม่ได้
        </CardDescription>
      </div>

      {error ? (
        <p className="mt-5 rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {profiles.map((profile) => {
          const selectedDoctorId =
            selections[profile.id] ?? defaultDoctorMap[profile.id] ?? "";

          return (
            <div
              key={profile.id}
              className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
                  </div>
                  {profile.doctorRequestNote ? (
                    <p className="text-base leading-7 text-slate-600">
                      ข้อความจากผู้สูงอายุ: {profile.doctorRequestNote}
                    </p>
                  ) : null}
                  <p className="text-base leading-7 text-slate-600">
                    คุณหมอที่กำลังดูแล:{" "}
                    {profile.doctors.length
                      ? profile.doctors.map((doctor) => doctor.name).join(", ")
                      : "ยังไม่มี"}
                  </p>
                </div>

                <div className="flex min-w-[300px] flex-col gap-3">
                  <Select
                    value={selectedDoctorId}
                    onChange={(event) =>
                      setSelections((current) => ({
                        ...current,
                        [profile.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">เลือกคุณหมอ</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} ({doctor.email})
                      </option>
                    ))}
                  </Select>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={isPending || !selectedDoctorId}
                      onClick={() =>
                        runAction(profile.id, {
                          action: "ASSIGN_DOCTOR",
                          doctorId: selectedDoctorId,
                        })
                      }
                    >
                      จับคู่คุณหมอ
                    </Button>

                    <Button
                      variant="secondary"
                      disabled={isPending}
                      onClick={() =>
                        runAction(profile.id, {
                          action: "REQUEST_DOCTOR",
                          requestNote:
                            profile.doctorRequestNote ?? "เปิดคิวใหม่ให้คุณหมอคนอื่นรับเคส",
                        })
                      }
                    >
                      เปิดรอคุณหมอคนใหม่
                    </Button>
                  </div>

                  {profile.doctors.map((doctor) => (
                    <Button
                      key={`${profile.id}-${doctor.id}`}
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        runAction(profile.id, {
                          action: "REMOVE_DOCTOR",
                          doctorId: doctor.id,
                          closedNote: "ยกเลิกการดูแลโดยแอดมิน",
                        })
                      }
                    >
                      ยกเลิกคุณหมอ {doctor.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
