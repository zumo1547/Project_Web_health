import Link from "next/link";

type SectionNavItem = {
  href: string;
  label: string;
  eyebrow?: string;
};

type SectionNavProps = {
  items: SectionNavItem[];
  tone?: "doctor" | "elderly" | "admin";
};

const toneStyles: Record<NonNullable<SectionNavProps["tone"]>, string> = {
  doctor:
    "border-slate-900/10 bg-slate-950/90 text-white shadow-[0_18px_50px_-36px_rgba(15,23,42,0.75)]",
  elderly:
    "border-white/70 bg-white/86 text-slate-900 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.25)]",
  admin:
    "border-amber-200/70 bg-white/88 text-slate-900 shadow-[0_18px_48px_-36px_rgba(120,53,15,0.22)]",
};

const linkToneStyles: Record<NonNullable<SectionNavProps["tone"]>, string> = {
  doctor:
    "border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-white/10",
  elderly:
    "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
  admin:
    "border-amber-100 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800",
};

export function SectionNav({
  items,
  tone = "elderly",
}: SectionNavProps) {
  if (!items.length) {
    return null;
  }

  return (
    <nav
      className={`sticky top-3 z-30 mt-5 overflow-hidden rounded-[1.45rem] border px-2 py-2 backdrop-blur sm:mt-8 sm:rounded-[1.9rem] sm:px-4 sm:py-3 ${toneStyles[tone]}`}
      aria-label="Section navigation"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 pr-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`min-w-[9.5rem] shrink-0 snap-start rounded-[1.1rem] border px-3.5 py-3 transition sm:min-w-[11rem] sm:rounded-[1.35rem] sm:px-4 ${linkToneStyles[tone]}`}
          >
            {item.eyebrow ? (
              <p className="hidden text-[0.68rem] font-bold uppercase tracking-[0.18em] opacity-70 sm:block">
                {item.eyebrow}
              </p>
            ) : null}
            <p className="text-sm font-bold leading-6 sm:mt-1 sm:text-base">{item.label}</p>
          </Link>
        ))}
      </div>
    </nav>
  );
}
