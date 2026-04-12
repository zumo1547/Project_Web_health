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
  quickLinks: AuthShowcaseLink[];
  supportTitle?: string;
  quickLinksTitle?: string;
  tone?: "emerald" | "sky" | "amber";
};

const toneClasses: Record<
  NonNullable<AuthShowcaseProps["tone"]>,
  {
    panel: string;
    pill: string;
    card: string;
    link: string;
  }
> = {
  emerald: {
    panel:
      "bg-[linear-gradient(145deg,#065f46_0%,#0f172a_52%,#0f766e_100%)] text-white",
    pill: "bg-white/14 text-emerald-100 ring-1 ring-white/15",
    card: "bg-white/10 text-white/92 ring-1 ring-white/12",
    link: "text-emerald-100 hover:text-white",
  },
  sky: {
    panel:
      "bg-[linear-gradient(145deg,#0f4c81_0%,#0f172a_52%,#0f766e_100%)] text-white",
    pill: "bg-white/14 text-sky-100 ring-1 ring-white/15",
    card: "bg-white/10 text-white/92 ring-1 ring-white/12",
    link: "text-sky-100 hover:text-white",
  },
  amber: {
    panel:
      "bg-[linear-gradient(145deg,#92400e_0%,#0f172a_52%,#b45309_100%)] text-white",
    pill: "bg-white/14 text-amber-100 ring-1 ring-white/15",
    card: "bg-white/10 text-white/92 ring-1 ring-white/12",
    link: "text-amber-100 hover:text-white",
  },
};

export function AuthShowcase({
  eyebrow,
  title,
  description,
  supportItems,
  audienceItems,
  quickLinks,
  supportTitle = "เว็บนี้ช่วยอะไรได้บ้าง",
  quickLinksTitle = "ทำไมถึงควรใช้",
  tone = "emerald",
}: AuthShowcaseProps) {
  const styles = toneClasses[tone];

  return (
    <section
      className={`page-section-animate relative overflow-hidden rounded-[2.5rem] border border-white/18 px-6 py-7 shadow-[0_34px_110px_-58px_rgba(15,23,42,0.68)] sm:px-8 sm:py-8 lg:px-10 lg:py-9 ${styles.panel}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_22%)]" />
      <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl sm:h-28 sm:w-28" />
      <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-emerald-300/10 blur-2xl sm:h-28 sm:w-28" />

      <div className="relative flex h-full flex-col gap-7">
        <div className="space-y-5">
          <div
            className={`inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] ${styles.pill}`}
          >
            {eyebrow}
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-[2.7rem] font-black tracking-tight text-white sm:text-[3.2rem] lg:text-[3.85rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/84 sm:text-[1.08rem]">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {audienceItems.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white/92"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr]">
          <div className={`rounded-[1.9rem] p-5 sm:p-6 ${styles.card}`}>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/65">
              {supportTitle}
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 sm:text-[0.98rem]">
              {supportItems.map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/14 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-white/88">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[1.9rem] p-5 sm:p-6 ${styles.card}`}>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/65">
              {quickLinksTitle}
            </p>

            <div className="mt-4 space-y-3 text-sm leading-7 text-white/88">
              <p>ใช้งานง่าย ไม่ต้องเปิดหลายหน้า เข้าแล้วเริ่มตรวจสุขภาพได้จากจุดเดียว</p>
              <p>เก็บข้อมูลเดิมไว้ครบ ช่วยให้ดูอาการ ยา และค่าที่เคยบันทึกย้อนหลังได้เร็วขึ้น</p>
              <p>เมื่อมีข้อสงสัยก็ถาม AI หรือส่งต่อให้คุณหมอดูได้ทันทีจากหน้าเดียวกัน</p>
            </div>

            <div className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-[1.2rem] border border-white/14 bg-white/12 px-4 py-3 text-sm font-bold transition hover:bg-white/18 ${styles.link}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
