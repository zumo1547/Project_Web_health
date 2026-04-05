"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

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

function getSupportMeta(icon: FloatingSupportItem["icon"]) {
  if (icon === "doctor") {
    return {
      eyebrow: "ห้องแชทกับคุณหมอ",
      headline: "คุยกับคุณหมอที่ดูแลเคส",
      helper: "ใช้ส่งอาการ ผลตรวจ หรือคำถามให้คุณหมอช่วยดูต่อได้ทันที",
      badge: "ดูแลโดยทีมแพทย์",
    };
  }

  return {
    eyebrow: "ผู้ช่วย AI สุขภาพ",
    headline: "คุยกับ AI เรื่องยาและความดัน",
    helper: "ใช้ถามเรื่องยา ค่าความดัน และขอให้ AI ช่วยสรุปข้อมูลสุขภาพล่าสุด",
    badge: "ตอบจากข้อมูลในแฟ้ม",
  };
}

export function FloatingSupportDock({ items }: FloatingSupportDockProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items],
  );

  if (!items.length) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2.5 sm:bottom-6 sm:right-6 sm:gap-3 lg:bottom-auto lg:right-6 lg:top-1/2 lg:w-[19rem] lg:-translate-y-1/2 lg:gap-4">
        {items.map((item) => {
          const meta = getSupportMeta(item.icon);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className="floating-dock-button motion-button group inline-flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/80 bg-slate-950 p-0 text-left text-white shadow-[0_24px_60px_-34px_rgba(2,6,23,0.78)] transition hover:-translate-y-0.5 hover:bg-slate-900 sm:h-auto sm:w-auto sm:gap-3 sm:rounded-full sm:px-4 sm:py-3 lg:w-full lg:items-start lg:justify-start lg:rounded-[1.8rem] lg:border-slate-800/20 lg:px-4 lg:py-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 sm:h-11 sm:w-11">
                <FloatingIcon icon={item.icon} />
              </span>

              <span className="hidden min-w-0 sm:block lg:flex-1">
                <span className="block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-200/80 lg:text-[0.7rem]">
                  {meta.eyebrow}
                </span>
                <span className="mt-1 block text-sm font-black text-white lg:text-base">
                  {meta.headline}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-300 lg:text-[0.82rem]">
                  {meta.helper}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close support panel"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setActiveId(null)}
          />

          <div className="floating-panel-enter absolute inset-x-0 bottom-0 mx-auto max-h-[82vh] w-full max-w-[32rem] overflow-hidden rounded-t-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(247,250,252,0.98)_100%)] shadow-[0_30px_80px_-34px_rgba(15,23,42,0.5)] sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0 sm:max-h-[calc(100vh-5rem)] sm:rounded-[2rem] lg:right-8 lg:top-1/2 lg:bottom-auto lg:max-h-[calc(100vh-6rem)] lg:w-[min(32rem,calc(100vw-28rem))] lg:-translate-y-1/2">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  <FloatingIcon icon={activeItem.icon} />
                  <span>{getSupportMeta(activeItem.icon).eyebrow}</span>
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight text-slate-950">
                    {getSupportMeta(activeItem.icon).headline}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {getSupportMeta(activeItem.icon).helper}
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {getSupportMeta(activeItem.icon).badge}
                </div>
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
    </>
  );
}
