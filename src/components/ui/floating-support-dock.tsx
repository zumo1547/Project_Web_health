"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type FloatingSupportItem = {
  id: string;
  label: string;
  description: string;
  icon: "ai" | "doctor";
  content: React.ReactNode;
};

type FloatingSupportDockProps = {
  items: FloatingSupportItem[];
};

function FloatingIcon({ icon }: { icon: FloatingSupportItem["icon"] }) {
  if (icon === "doctor") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v8" />
        <path d="M8 6h8" />
        <path d="M5 13a7 7 0 1 1 14 0v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 sm:h-5 sm:w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 4 7v6c0 4 3.4 7.2 8 8 4.6-.8 8-4 8-8V7z" />
      <path d="M9.5 11.5h5" />
      <path d="M12 9v5" />
    </svg>
  );
}

export function FloatingSupportDock({ items }: FloatingSupportDockProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const canUseDOM = typeof window !== "undefined" && typeof document !== "undefined";

  useEffect(() => {
    if (!canUseDOM) {
      return;
    }

    const syncMenuState = () => {
      const open = document.body.dataset.quickNavOpen === "true";
      setMenuOpen(open);

      if (open) {
        setActiveId(null);
      }
    };

    const handleToggle = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      const open = Boolean(detail?.open);
      setMenuOpen(open);

      if (open) {
        setActiveId(null);
      }
    };

    syncMenuState();
    window.addEventListener("quick-nav-toggle", handleToggle as EventListener);

    return () => {
      window.removeEventListener("quick-nav-toggle", handleToggle as EventListener);
    };
  }, [canUseDOM]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items],
  );

  if (!items.length || !canUseDOM) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={`fixed bottom-4 right-4 flex flex-col gap-2.5 transition-[opacity,transform] duration-200 sm:bottom-6 sm:right-6 sm:gap-3 ${
          menuOpen
            ? "pointer-events-none z-30 translate-x-2 opacity-0 sm:pointer-events-auto sm:z-40 sm:translate-x-0 sm:opacity-100"
            : "z-40 opacity-100"
        }`}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className="floating-dock-button motion-button group inline-flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/80 bg-slate-950 p-0 text-left text-white shadow-[0_24px_60px_-34px_rgba(2,6,23,0.78)] transition hover:-translate-y-0.5 hover:bg-slate-900 sm:h-auto sm:w-auto sm:gap-3 sm:rounded-full sm:px-4 sm:py-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 sm:h-11 sm:w-11">
              <FloatingIcon icon={item.icon} />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block text-sm font-bold">{item.label}</span>
              <span className="block text-xs text-slate-300">{item.description}</span>
            </span>
          </button>
        ))}
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close support panel"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setActiveId(null)}
          />

          <div className="floating-panel-enter absolute inset-x-0 bottom-0 mx-auto max-h-[82vh] w-full max-w-[32rem] overflow-hidden rounded-t-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(247,250,252,0.98)_100%)] shadow-[0_30px_80px_-34px_rgba(15,23,42,0.5)] sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0 sm:max-h-[calc(100vh-5rem)] sm:rounded-[2rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  <FloatingIcon icon={activeItem.icon} />
                  <span>{activeItem.label}</span>
                </div>
                <p className="text-sm text-slate-500">{activeItem.description}</p>
              </div>

              <Button type="button" variant="ghost" onClick={() => setActiveId(null)}>
                ปิด
              </Button>
            </div>

            <div className="max-h-[calc(82vh-5rem)] overflow-y-auto px-4 py-4 sm:max-h-[calc(100vh-10rem)]">
              {activeItem.content}
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
