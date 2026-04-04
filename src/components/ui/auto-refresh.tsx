"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AutoRefreshProps = {
  intervalMs?: number;
  enabled?: boolean;
};

export function AutoRefresh({
  intervalMs = 5000,
  enabled = true,
}: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      router.refresh();
    };

    const timer = window.setInterval(refresh, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
