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
        className={`flex h-full flex-col justify-between border transition duration-200 hover:-translate-y-1 ${toneStyles[tone]}`}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            {eyebrow}
          </p>
          <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
        </div>
        <p className="mt-6 text-base font-bold text-emerald-700">เปิดใช้งานทันที</p>
      </Card>
    </Link>
  );
}
