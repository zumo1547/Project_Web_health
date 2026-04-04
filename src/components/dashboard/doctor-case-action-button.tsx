"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DoctorCaseActionButtonProps = {
  elderlyId: string;
  action: "JOIN_SELF" | "COMPLETE_SELF";
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function DoctorCaseActionButton({
  elderlyId,
  action,
  label,
  variant = "primary",
}: DoctorCaseActionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError("");

    const closedNote =
      action === "COMPLETE_SELF"
        ? window.prompt("ต้องการบันทึกหมายเหตุปิดเคสหรือไม่?", "") ?? ""
        : undefined;

    const response = await fetch(`/api/elderly/${elderlyId}/case-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        closedNote,
      }),
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
    <div className="space-y-2">
      <Button variant={variant} disabled={isPending} onClick={handleClick}>
        {isPending ? "กำลังอัปเดต..." : label}
      </Button>
      {error ? <p className="text-sm leading-6 text-rose-700">{error}</p> : null}
    </div>
  );
}
