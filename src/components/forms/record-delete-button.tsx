"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type RecordDeleteButtonProps = {
  endpoint: string;
  confirmMessage: string;
  label?: string;
  className?: string;
};

function getDeleteErrorMessage(result: unknown, fallback: string) {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    return result.error;
  }

  return fallback;
}

export function RecordDeleteButton({
  endpoint,
  confirmMessage,
  label = "ลบรายการนี้",
  className = "",
}: RecordDeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setError("");

    const response = await fetch(endpoint, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      setError(getDeleteErrorMessage(result, "ลบรายการไม่สำเร็จ กรุณาลองอีกครั้ง"));
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant="danger"
        disabled={isPending}
        onClick={handleDelete}
        className="min-h-[2.5rem] px-4 py-2 text-sm"
      >
        {isPending ? "กำลังลบ..." : label}
      </Button>
      {error ? <p className="text-sm leading-6 text-rose-700">{error}</p> : null}
    </div>
  );
}
