import { Card } from "@/components/ui/card";
import Link from "next/link";

type QuickActionCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "doctor" | "elderly" | "admin";
};

const toneStyles: Record<NonNullable<QuickActionCardProps["tone"]>, string> = {
  doctor:
    "border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] hover:border-cyan-300",
  elderly:
    "border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(240,253,244,0.96)_100%)] hover:border-amber-300",
  admin:
    "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.99)_0%,rgba(255,247,237,0.96)_100%)] hover:border-amber-300",
};

export function QuickActionCard({
  href,
  eyebrow,
  title,
  description,
  tone = "elderly",
}: QuickActionCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card
        className={`relative flex h-full flex-col justify-between overflow-hidden border transition duration-200 hover:-translate-y-1 ${toneStyles[tone]}`}
      >
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/45 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{eyebrow}</span>
          </div>
          <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
        </div>
        <div className="relative mt-6 flex items-center justify-between">
          <p className="text-base font-bold text-emerald-700">เปิดใช้งานทันที</p>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-emerald-700 shadow-[0_14px_24px_-18px_rgba(16,185,129,0.7)]">
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </Card>
    </Link>
  );
}
