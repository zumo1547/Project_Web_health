"use client";

import Link from "next/link";

import {
  SocialAuthButtons,
  type SocialProvider,
} from "@/components/forms/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatSystemDateTime } from "@/lib/date-time";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useState, useTransition } from "react";

type LoginPortal = "USER" | "DOCTOR" | "ADMIN";

type LoginFormProps = {
  defaultCallbackUrl: string;
  portal: LoginPortal;
  title: string;
  description: string;
  accent: "user" | "doctor" | "admin";
  socialProviders?: SocialProvider[];
  className?: string;
};

type RememberedLogin = {
  email: string;
  portal: LoginPortal;
  usageCount: number;
  lastUsedAt: string;
};

const LOGIN_MEMORY_KEY = "senior-health-check.remembered-logins";

const accentStyles: Record<
  LoginFormProps["accent"],
  {
    card: string;
    button: string;
    hint: string;
    socialTone: "emerald" | "sky";
  }
> = {
  user: {
    card:
      "border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.96)_100%)]",
    button: "bg-emerald-700 hover:bg-emerald-800 focus-visible:outline-emerald-700",
    hint: "text-emerald-700",
    socialTone: "emerald",
  },
  doctor: {
    card:
      "border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.96)_100%)]",
    button: "bg-slate-950 hover:bg-slate-800 focus-visible:outline-slate-900",
    hint: "text-cyan-700",
    socialTone: "sky",
  },
  admin: {
    card:
      "border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,251,235,0.96)_100%)]",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600",
    hint: "text-amber-700",
    socialTone: "emerald",
  },
};

function formatDate(value: string) {
  return formatSystemDateTime(value);
}

function loadRememberedLogins(portal: LoginPortal) {
  if (typeof window === "undefined") {
    return [] as RememberedLogin[];
  }

  try {
    const raw = window.localStorage.getItem(LOGIN_MEMORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is RememberedLogin =>
          item &&
          typeof item === "object" &&
          typeof item.email === "string" &&
          typeof item.portal === "string" &&
          typeof item.usageCount === "number" &&
          typeof item.lastUsedAt === "string" &&
          item.portal === portal,
      )
      .sort((left, right) => {
        if (right.usageCount !== left.usageCount) {
          return right.usageCount - left.usageCount;
        }

        return (
          new Date(right.lastUsedAt).getTime() - new Date(left.lastUsedAt).getTime()
        );
      })
      .slice(0, 4);
  } catch {
    return [];
  }
}

function rememberLoginAccount(email: string, portal: LoginPortal) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(LOGIN_MEMORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const records = Array.isArray(parsed) ? parsed : [];
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    const nextRecords = records.filter(
      (item) =>
        !(
          item &&
          typeof item === "object" &&
          item.email === normalizedEmail &&
          item.portal === portal
        ),
    );

    const currentRecord = records.find(
      (item) =>
        item &&
        typeof item === "object" &&
        item.email === normalizedEmail &&
        item.portal === portal,
    ) as RememberedLogin | undefined;

    nextRecords.push({
      email: normalizedEmail,
      portal,
      usageCount: (currentRecord?.usageCount ?? 0) + 1,
      lastUsedAt: now,
    });

    nextRecords.sort((left, right) => {
      if (
        typeof left?.usageCount === "number" &&
        typeof right?.usageCount === "number" &&
        right.usageCount !== left.usageCount
      ) {
        return right.usageCount - left.usageCount;
      }

      return (
        new Date(String(right?.lastUsedAt ?? now)).getTime() -
        new Date(String(left?.lastUsedAt ?? now)).getTime()
      );
    });

    window.localStorage.setItem(
      LOGIN_MEMORY_KEY,
      JSON.stringify(nextRecords.slice(0, 8)),
    );
  } catch {
    // Ignore local storage issues.
  }
}

export function LoginForm({
  defaultCallbackUrl,
  portal,
  title,
  description,
  accent,
  socialProviders = [],
  className = "",
}: LoginFormProps) {
  const router = useRouter();
  const passwordInputId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberedLogins, setRememberedLogins] = useState<RememberedLogin[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const styles = accentStyles[accent];

  useEffect(() => {
    setRememberedLogins(loadRememberedLogins(portal));
  }, [portal]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      portal,
      redirect: false,
      callbackUrl: defaultCallbackUrl,
    });

    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง");
      return;
    }

    rememberLoginAccount(email, portal);
    setRememberedLogins(loadRememberedLogins(portal));
    setPassword("");

    startTransition(() => {
      router.push(defaultCallbackUrl || "/dashboard");
      router.refresh();
    });
  }

  function handlePickRememberedLogin(nextEmail: string) {
    setEmail(nextEmail);
    setPassword("");
    setError("");

    window.requestAnimationFrame(() => {
      document.getElementById(passwordInputId)?.focus();
    });
  }

  const showSocialLogin = portal === "USER" && socialProviders.length > 0;
  const showRegisterPrompt = portal === "USER";

  return (
    <Card
      className={`mx-auto w-full max-w-[31rem] rounded-[2.15rem] ${styles.card} p-5 sm:p-6 lg:max-w-[30rem] xl:max-w-[31rem] ${className}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm font-bold uppercase tracking-[0.24em] ${styles.hint}`}>
            Portal Login
          </p>
          <span className="rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            ใช้งานได้ทั้งมือถือและคอม
          </span>
        </div>

        <div className="space-y-2">
          <CardTitle className="text-[1.85rem] sm:text-[2.05rem]">{title}</CardTitle>
          <CardDescription className="max-w-xl">{description}</CardDescription>
        </div>
      </div>

      {rememberedLogins.length > 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/82 p-4 sm:p-5">
          <p className="text-base font-bold text-slate-950">บัญชีที่ใช้บ่อยในเครื่องนี้</p>
          <p className="mt-1 text-sm leading-7 text-slate-600">
            กดเลือกบัญชีก่อน แล้วกรอกรหัสผ่านเพื่อเข้าสู่ระบบได้ทันที
          </p>

          <div className="mt-4 grid gap-3">
            {rememberedLogins.map((item) => (
              <button
                key={`${item.portal}-${item.email}`}
                type="button"
                onClick={() => handlePickRememberedLogin(item.email)}
                className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <p className="text-base font-bold text-slate-950">{item.email}</p>
                <p className="mt-1 text-sm text-slate-500">ใช้บ่อยแล้ว {item.usageCount} ครั้ง</p>
                <p className="mt-1 text-xs text-slate-400">
                  ใช้ล่าสุด {formatDate(item.lastUsedAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showSocialLogin ? (
        <div className="mt-5">
          <SocialAuthButtons
            providers={socialProviders}
            callbackUrl={defaultCallbackUrl}
            title="เริ่มใช้งานด้วย Google หรือ Facebook"
            description="เหมาะกับการเข้าสู่ระบบอย่างรวดเร็ว กดครั้งเดียวแล้วเริ่มใช้งานต่อได้เลย"
            tone={styles.socialTone}
          />
        </div>
      ) : null}

      <div className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/82 p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-base font-bold text-slate-950">เข้าสู่ระบบด้วยอีเมล</p>
          <p className="text-sm leading-7 text-slate-600">
            ถ้ามีบัญชีเดิมอยู่แล้ว สามารถใช้อีเมลและรหัสผ่านเดิมเข้าสู่ระบบได้ตามปกติ
          </p>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">อีเมล</span>
            <Input
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">รหัสผ่าน</span>
            <Input
              id={passwordInputId}
              name="password"
              type="password"
              placeholder="กรอกรหัสผ่านของคุณ"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="rounded-[1.2rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" fullWidth disabled={isPending} className={styles.button}>
            {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>

          {showRegisterPrompt ? (
            <div className="flex flex-col gap-2 rounded-[1.2rem] border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-900">ยังไม่มีบัญชีใช่ไหม?</p>
                <p className="mt-1 leading-6 text-slate-600">
                  สมัครสมาชิกก่อน แล้วกลับมาเข้าสู่ระบบเพื่อเริ่มบันทึกข้อมูลสุขภาพได้ทันที
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex shrink-0 rounded-[1rem] border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                สมัครสมาชิก
              </Link>
            </div>
          ) : null}
        </form>
      </div>
    </Card>
  );
}
