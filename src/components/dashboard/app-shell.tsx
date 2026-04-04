import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/ui/logout-button";
import { roleLabels } from "@/lib/permissions";
import type { Session } from "next-auth";
import Link from "next/link";

type PortalKind = "doctor" | "elderly" | "admin";

type AppShellProps = {
  portal: PortalKind;
  title: string;
  subtitle: string;
  user: Session["user"];
  children: React.ReactNode;
  actions?: React.ReactNode;
};

const portalStyles: Record<
  PortalKind,
  {
    page: string;
    header: string;
    navActive: string;
    navIdle: string;
    badgeTone: "emerald" | "amber" | "slate";
    eyebrow: string;
    subtitle: string;
  }
> = {
  doctor: {
    page:
      "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_24%),linear-gradient(180deg,#eef8f8_0%,#e9f1f5_52%,#f6fbfc_100%)]",
    header:
      "border-slate-900/10 bg-slate-950/96 text-white shadow-[0_28px_80px_-48px_rgba(2,6,23,0.82)]",
    navActive: "border-white bg-white text-slate-950",
    navIdle: "bg-white/10 text-slate-100 hover:bg-white/20",
    badgeTone: "amber",
    eyebrow: "ศูนย์ติดตามเคสคุณหมอ",
    subtitle:
      "ใช้รับเคสจากแอปตรวจสุขภาพผู้สูงอายุ เปิดแฟ้มย้อนหลัง และติดตามข้อมูลสุขภาพที่ส่งเข้ามา",
  },
  elderly: {
    page:
      "bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_24%),linear-gradient(180deg,#fcf8ef_0%,#f6f1e8_45%,#eef7ef_100%)]",
    header:
      "border-white/70 bg-white/86 text-slate-900 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]",
    navActive: "border-emerald-700 bg-emerald-700 text-white",
    navIdle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    badgeTone: "emerald",
    eyebrow: "แอปตรวจสุขภาพผู้สูงอายุ",
    subtitle:
      "ตรวจความดัน สแกนยา ดูสรุปสุขภาพ และขอคำแนะนำจาก AI หรือคุณหมอได้ในที่เดียว",
  },
  admin: {
    page:
      "bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_24%),linear-gradient(180deg,#fffaf0_0%,#f8f1e6_52%,#fffdf8_100%)]",
    header:
      "border-amber-200/70 bg-white/86 text-slate-900 shadow-[0_24px_70px_-45px_rgba(120,53,15,0.38)]",
    navActive: "border-amber-600 bg-amber-600 text-white",
    navIdle: "bg-amber-50 text-slate-700 hover:bg-amber-100",
    badgeTone: "slate",
    eyebrow: "ศูนย์จัดการระบบ",
    subtitle:
      "จัดการบัญชี เชื่อมคุณหมอกับผู้สูงอายุ และดูภาพรวมของแอปตรวจสุขภาพทั้งระบบ",
  },
};

export function AppShell({
  portal,
  title,
  subtitle,
  user,
  children,
  actions,
}: AppShellProps) {
  const styles = portalStyles[portal];
  const portalSwitchContainerClass =
    portal === "doctor"
      ? "inline-flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-white/10 bg-white/5 p-1.5"
      : "inline-flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-slate-100/90 p-1.5";
  const portalSwitches =
    user.role === "ADMIN"
      ? [
          {
            href: "/doctor",
            label: "โหมดคุณหมอ",
            active: portal === "doctor",
          },
          {
            href: "/admin",
            label: "หน้าแอดมิน",
            active: portal === "admin",
          },
        ]
      : [];

  return (
    <div className={`min-h-screen ${styles.page}`}>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className={`rounded-[2.2rem] border p-4 backdrop-blur sm:p-6 ${styles.header}`}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <Link href="/" className="text-xl font-black tracking-tight">
                  Senior Health Check
                </Link>
                <Badge tone={styles.badgeTone}>{styles.eyebrow}</Badge>
                <Badge tone={portal === "doctor" ? "slate" : "amber"}>
                  {roleLabels[user.role]}
                </Badge>
              </div>

              <div className="space-y-2">
                <p
                  className={`text-sm sm:text-base ${
                    portal === "doctor" ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {user.email}
                </p>
                <p
                  className={`max-w-3xl text-sm leading-7 sm:text-base ${
                    portal === "doctor" ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  {styles.subtitle}
                </p>
              </div>

              {portalSwitches.length > 0 ? (
                <nav className={`${portalSwitchContainerClass} text-sm sm:text-base`}>
                  {portalSwitches.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={item.active ? "page" : undefined}
                      className={`inline-flex min-h-[3rem] items-center justify-center rounded-full px-5 py-2.5 font-bold leading-none whitespace-nowrap transition ${
                        item.active
                          ? portal === "doctor"
                            ? "border border-amber-100 bg-amber-50 !text-slate-950 shadow-[0_16px_30px_-22px_rgba(255,251,235,0.95)]"
                            : "border border-amber-500 bg-amber-500 !text-white shadow-[0_18px_34px_-24px_rgba(217,119,6,0.65)]"
                          : portal === "doctor"
                            ? "border border-white/10 bg-slate-900/40 !text-white hover:bg-white/10"
                            : "border border-slate-200 bg-white !text-slate-700 hover:bg-white/80"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              {actions}
              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="mt-8 flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
            {styles.eyebrow}
          </p>
          <h1 className="max-w-4xl text-[2rem] font-black tracking-tight text-slate-950 sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h1>
          <p className="max-w-4xl text-base leading-8 text-slate-600 sm:text-lg">
            {subtitle}
          </p>
        </section>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
