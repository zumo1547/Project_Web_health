import { Card } from "@/components/ui/card";

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  tone?: "doctor" | "elderly" | "alert" | "admin";
};

const toneStyles: Record<NonNullable<SummaryCardProps["tone"]>, string> = {
  doctor:
    "border-cyan-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.98)_0%,rgba(236,253,245,0.94)_100%)]",
  elderly:
    "border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(236,253,245,0.94)_100%)]",
  alert:
    "border-rose-100 bg-[linear-gradient(180deg,rgba(255,241,242,0.98)_0%,rgba(255,251,235,0.94)_100%)]",
  admin:
    "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.99)_0%,rgba(255,247,237,0.95)_100%)]",
};

export function SummaryCard({
  label,
  value,
  description,
  tone = "elderly",
}: SummaryCardProps) {
  return (
    <Card className={`space-y-3 border ${toneStyles[tone]}`}>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="text-[2.15rem] font-black tracking-tight text-slate-950 sm:text-[2.4rem]">
        {value}
      </p>
      <p className="text-base leading-7 text-slate-600">{description}</p>
    </Card>
  );
}
