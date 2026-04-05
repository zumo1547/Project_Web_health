"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SectionNavItem = {
  href: string;
  label: string;
  eyebrow?: string;
};

type SectionNavProps = {
  items: SectionNavItem[];
  tone?: "doctor" | "elderly" | "admin";
};

const desktopToneStyles: Record<NonNullable<SectionNavProps["tone"]>, string> = {
  doctor:
    "border-slate-900/10 bg-slate-950/90 text-white shadow-[0_18px_50px_-36px_rgba(15,23,42,0.75)]",
  elderly:
    "border-white/70 bg-white/86 text-slate-900 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.25)]",
  admin:
    "border-amber-200/70 bg-white/88 text-slate-900 shadow-[0_18px_48px_-36px_rgba(120,53,15,0.22)]",
};

const desktopLinkToneStyles: Record<
  NonNullable<SectionNavProps["tone"]>,
  string
> = {
  doctor:
    "border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-white/10",
  elderly:
    "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
  admin:
    "border-amber-100 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800",
};

const mobileButtonToneStyles: Record<NonNullable<SectionNavProps["tone"]>, string> =
  {
    doctor:
      "border-slate-900/10 bg-slate-950 text-white shadow-[0_20px_44px_-30px_rgba(15,23,42,0.76)]",
    elderly:
      "border-white/80 bg-white/92 text-slate-900 shadow-[0_20px_44px_-30px_rgba(15,23,42,0.24)]",
    admin:
      "border-amber-200/70 bg-white/92 text-slate-900 shadow-[0_20px_44px_-30px_rgba(120,53,15,0.22)]",
  };

const drawerToneStyles: Record<NonNullable<SectionNavProps["tone"]>, string> = {
  doctor:
    "border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.99)_0%,rgba(15,23,42,0.98)_100%)] text-white",
  elderly:
    "border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,250,252,0.98)_100%)] text-slate-900",
  admin:
    "border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(255,251,235,0.98)_100%)] text-slate-900",
};

const drawerLinkToneStyles: Record<NonNullable<SectionNavProps["tone"]>, string> =
  {
    doctor:
      "border-white/10 bg-white/5 text-white hover:border-cyan-300/40 hover:bg-white/10",
    elderly:
      "border-slate-200 bg-white text-slate-900 hover:border-emerald-200 hover:bg-emerald-50",
    admin:
      "border-amber-100 bg-white text-slate-900 hover:border-amber-200 hover:bg-amber-50",
  };

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function ItemIcon({ index }: { index: number }) {
  const icons = [
    <path key="home" d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
    <path key="quick" d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />,
    <>
      <path key="support-1" d="M12 21c4.8-1 8-4.4 8-8.4V6.8L12 3 4 6.8v5.8c0 4 3.2 7.4 8 8.4Z" />
      <path key="support-2" d="M9.5 12h5" />
    </>,
    <>
      <rect key="scan-1" x="4" y="6" width="16" height="12" rx="2" />
      <path key="scan-2" d="M9 6V4" />
      <path key="scan-3" d="M15 6V4" />
    </>,
    <>
      <path key="pressure-1" d="M12 20V9" />
      <path key="pressure-2" d="M9 12h6" />
      <path key="pressure-3" d="M12 4a2.5 2.5 0 0 1 2.5 2.5v8.7a4.5 4.5 0 1 1-5 0V6.5A2.5 2.5 0 0 1 12 4Z" />
    </>,
    <>
      <path key="record-1" d="M8 3h8l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path key="record-2" d="M16 3v5h5" />
    </>,
  ];

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[index % icons.length]}
    </svg>
  );
}

export function SectionNav({ items, tone = "elderly" }: SectionNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!items.length) {
    return null;
  }

  return (
    <>
      <div className="sticky top-3 z-30 mt-5 flex justify-start sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open quick navigation"
          className={`inline-flex min-h-[3.15rem] items-center gap-3 rounded-full border px-4 py-2.5 ${mobileButtonToneStyles[tone]}`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
            <MenuIcon />
          </span>
          <span className="text-left">
            <span className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] opacity-55">
              Menu
            </span>
            <span className="block text-sm font-bold">เปิดเมนูด่วน</span>
          </span>
        </button>
      </div>

      <nav
        className={`sticky top-3 z-30 mt-8 hidden overflow-hidden rounded-[1.9rem] border px-4 py-3 backdrop-blur sm:block ${desktopToneStyles[tone]}`}
        aria-label="Section navigation"
      >
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`min-w-[11rem] shrink-0 rounded-[1.35rem] border px-4 py-3 transition ${desktopLinkToneStyles[tone]}`}
            >
              {item.eyebrow ? (
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] opacity-70">
                  {item.eyebrow}
                </p>
              ) : null}
              <p className="mt-1 text-base font-bold">{item.label}</p>
            </Link>
          ))}
        </div>
      </nav>

      {isOpen ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/38 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          <aside
            className={`absolute inset-y-0 left-0 flex w-[min(82vw,21rem)] flex-col border-r shadow-[0_36px_90px_-42px_rgba(15,23,42,0.6)] ${drawerToneStyles[tone]}`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-60">
                  Quick navigation
                </p>
                <p className="mt-1 text-lg font-black">เมนูทางลัด</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 opacity-80">
                เลือกหัวข้อที่ต้องการ แล้วระบบจะเลื่อนไปยังส่วนที่กดทันที
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-[1.35rem] border px-4 py-4 transition ${drawerLinkToneStyles[tone]}`}
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <ItemIcon index={index} />
                    </span>

                    <span className="min-w-0">
                      {item.eyebrow ? (
                        <span className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] opacity-60">
                          {item.eyebrow}
                        </span>
                      ) : null}
                      <span className="block text-base font-bold leading-6">
                        {item.label}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
