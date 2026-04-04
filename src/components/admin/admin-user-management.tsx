"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DOCTOR" | "ELDERLY" | "CAREGIVER";
  createdAt: string;
  elderlyProfileId: string | null;
  doctorCaseCount: number;
};

type AdminUserManagementProps = {
  currentUserId: string;
  users: AdminUserRow[];
};

const roleLabels: Record<AdminUserRow["role"], string> = {
  ADMIN: "แอดมิน",
  DOCTOR: "คุณหมอ",
  ELDERLY: "ผู้สูงอายุ",
  CAREGIVER: "บัญชีเดิม",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminUserManagement({
  currentUserId,
  users,
}: AdminUserManagementProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateRole(userId: string, role: "DOCTOR" | "ELDERLY") {
    setPendingId(userId);
    setError("");

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        typeof result.error === "string"
          ? result.error
          : "อัปเดตบทบาทไม่สำเร็จ",
      );
      setPendingId(null);
      return;
    }

    setPendingId(null);
    router.refresh();
  }

  async function deleteUser(userId: string) {
    const confirmed = window.confirm("ต้องการลบบัญชีนี้ใช่หรือไม่?");
    if (!confirmed) return;

    setPendingId(userId);
    setError("");

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        typeof result.error === "string" ? result.error : "ลบผู้ใช้ไม่สำเร็จ",
      );
      setPendingId(null);
      return;
    }

    setPendingId(null);
    router.refresh();
  }

  return (
    <Card>
      <div className="space-y-3">
        <CardTitle>จัดการผู้ใช้ทั้งหมด</CardTitle>
        <CardDescription>
          ดูรายชื่อผู้ใช้ทั้งหมด เปลี่ยนผู้ใช้ให้เป็นคุณหมอ และลบบัญชีที่ไม่ได้ใช้งานได้จากส่วนเดียว
        </CardDescription>
      </div>

      {error ? (
        <p className="mt-5 rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const canPromoteToDoctor =
            user.role !== "ADMIN" &&
            user.role !== "DOCTOR" &&
            !user.elderlyProfileId;
          const canDemoteToElderly =
            user.role === "DOCTOR" && user.doctorCaseCount === 0;

          return (
            <div
              key={user.id}
              className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-extrabold text-slate-950">{user.name}</p>
                    <Badge
                      tone={
                        user.role === "DOCTOR"
                          ? "emerald"
                          : user.role === "ADMIN"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {roleLabels[user.role]}
                    </Badge>
                    {isCurrentUser ? <Badge tone="amber">บัญชีที่กำลังใช้งาน</Badge> : null}
                  </div>
                  <p className="text-base text-slate-600">{user.email}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>สร้างเมื่อ {formatDate(user.createdAt)}</span>
                    {user.elderlyProfileId ? <span>ผูกกับแฟ้มผู้สูงอายุแล้ว</span> : null}
                    {user.doctorCaseCount > 0 ? (
                      <span>มีเคสคุณหมอที่รับไว้ {user.doctorCaseCount} เคส</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canPromoteToDoctor ? (
                    <Button
                      disabled={pendingId === user.id}
                      onClick={() => updateRole(user.id, "DOCTOR")}
                    >
                      ตั้งเป็นคุณหมอ
                    </Button>
                  ) : null}

                  {canDemoteToElderly ? (
                    <Button
                      variant="secondary"
                      disabled={pendingId === user.id}
                      onClick={() => updateRole(user.id, "ELDERLY")}
                    >
                      เปลี่ยนกลับเป็นผู้สูงอายุ
                    </Button>
                  ) : null}

                  {!isCurrentUser ? (
                    <Button
                      variant="danger"
                      disabled={pendingId === user.id}
                      onClick={() => deleteUser(user.id)}
                    >
                      ลบผู้ใช้
                    </Button>
                  ) : null}
                </div>
              </div>

              {!canPromoteToDoctor &&
              user.role !== "ADMIN" &&
              user.role !== "DOCTOR" &&
              user.elderlyProfileId ? (
                <p className="mt-3 text-sm leading-7 text-amber-700">
                  หากต้องการตั้งเป็นคุณหมอ ต้องยกเลิกการผูกกับแฟ้มผู้สูงอายุก่อน
                </p>
              ) : null}

              {!canDemoteToElderly &&
              user.role === "DOCTOR" &&
              user.doctorCaseCount > 0 ? (
                <p className="mt-3 text-sm leading-7 text-amber-700">
                  คุณหมอคนนี้ยังมีเคสที่รับไว้ จึงยังเปลี่ยนกลับไม่ได้
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
