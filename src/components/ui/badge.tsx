type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "emerald" | "amber" | "slate" | "rose";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  emerald: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-900",
  slate: "bg-slate-100 text-slate-700",
  rose: "bg-rose-100 text-rose-800",
};

export function Badge({
  className = "",
  tone = "slate",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold tracking-tight ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
