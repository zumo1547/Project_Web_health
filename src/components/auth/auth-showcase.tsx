import Link from "next/link";

type AuthShowcaseLink = {
  href: string;
  label: string;
};

type AuthShowcaseProps = {
  eyebrow: string;
  title: string;
  description: string;
  supportItems: string[];
  audienceItems: string[];
  startSteps?: string[];
  quickLinks?: AuthShowcaseLink[];
  supportTitle?: string;
  stepsTitle?: string;
  tone?: "emerald" | "sky" | "amber";
};

const toneClasses: Record<
  NonNullable<AuthShowcaseProps["tone"]>,
  {
    panel: string;
    eyebrow: string;
    chip: string;
    card: string;
    softCard: string;
    link: string;
  }
> = {
  emerald: {
    panel:
      "bg-[linear-gradient(145deg,#0f4f3d_0%,#0f172a_52%,#0f766e_100%)] text-white",
    eyebrow: "bg-white/15 text-emerald-100 ring-1 ring-white/20",
    chip: "border-white/20 bg-white/12 text-white/95",
    card: "border-white/20 bg-white/12 text-white/95",
    softCard: "border-white/16 bg-white/10 text-white/90",
    link: "text-emerald-100 hover:text-white",
  },
  sky: {
    panel:
      "bg-[linear-gradient(145deg,#0f4c81_0%,#0f172a_52%,#0f766e_100%)] text-white",
    eyebrow: "bg-white/15 text-sky-100 ring-1 ring-white/20",
    chip: "border-white/20 bg-white/12 text-white/95",
    card: "border-white/20 bg-white/12 text-white/95",
    softCard: "border-white/16 bg-white/10 text-white/90",
    link: "text-sky-100 hover:text-white",
  },
  amber: {
    panel:
      "bg-[linear-gradient(145deg,#9a3412_0%,#0f172a_52%,#b45309_100%)] text-white",
    eyebrow: "bg-white/15 text-amber-100 ring-1 ring-white/20",
    chip: "border-white/20 bg-white/12 text-white/95",
    card: "border-white/20 bg-white/12 text-white/95",
    softCard: "border-white/16 bg-white/10 text-white/90",
    link: "text-amber-100 hover:text-white",
  },
};

export function AuthShowcase({
  eyebrow,
  title,
  description,
  supportItems,
  audienceItems,
  startSteps = [],
  quickLinks = [],
  supportTitle = "เว็บนี้ช่วยอะไรได้บ้าง",
  stepsTitle = "เริ่มใช้งานอย่างไร",
  tone = "emerald",
}: AuthShowcaseProps) {
  const styles = toneClasses[tone];

  return (
    <section
      className={`page-section-animate relative overflow-hidden rounded-[2.2rem] border border-white/20 px-5 py-6 shadow-[0_34px_110px_-58px_rgba(15,23,42,0.65)] sm:px-8 sm:py-8 lg:px-9 lg:py-9 ${styles.panel}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_24%)]" />
      <div className="absolute -right-5 -top-3 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-6 -left-2 h-28 w-28 rounded-full bg-emerald-200/10 blur-2xl" />

      <div className="relative space-y-6">
        <div className="space-y-4">
          <span
            className={`inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${styles.eyebrow}`}
          >
            {eyebrow}
          </span>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-[2.2rem] font-black leading-tight tracking-tight text-white sm:text-[2.8rem] lg:text-[3.2rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/90 sm:text-[1.06rem]">
              {description}
            </p>
          </div>

          {audienceItems.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {audienceItems.map((item) => (
                <span
                  key={item}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${styles.chip}`}
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className={`rounded-[1.6rem] border p-4 sm:p-5 ${styles.card}`}>
            <h2 className="text-base font-bold text-white">{supportTitle}</h2>
            <ul className="mt-3 space-y-3">
              {supportItems.map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-white/92">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className={`rounded-[1.6rem] border p-4 sm:p-5 ${styles.softCard}`}>
            <h2 className="text-base font-bold text-white">{stepsTitle}</h2>

            {startSteps.length > 0 ? (
              <ol className="mt-3 space-y-2.5 text-sm leading-7 text-white/90">
                {startSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm leading-7 text-white/90">
                เข้าสู่ระบบให้สำเร็จ แล้วเลือกเมนูที่ต้องการใช้งาน ระบบจะพาไปทีละขั้นตอนแบบเข้าใจง่าย
              </p>
            )}

            {quickLinks.length > 0 ? (
              <div className="mt-4 grid gap-2.5">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex min-h-[2.9rem] items-center rounded-[1rem] border border-white/20 bg-white/12 px-4 text-sm font-bold transition hover:bg-white/18 ${styles.link}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}
