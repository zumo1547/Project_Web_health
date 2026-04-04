"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  }
> = {
  user: {
    card:
      "border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.97)_100%)]",
    button: "bg-emerald-700 hover:bg-emerald-800 focus-visible:outline-emerald-700",
    hint: "text-emerald-700",
  },
  doctor: {
    card:
      "border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.97)_100%)]",
    button: "bg-slate-950 hover:bg-slate-800 focus-visible:outline-slate-900",
    hint: "text-cyan-700",
  },
  admin: {
    card:
      "border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,251,235,0.97)_100%)]",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600",
    hint: "text-amber-700",
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
    // Ignore local storage errors and continue login flow normally.
  }
}

export function LoginForm({
  defaultCallbackUrl,
  portal,
  title,
  description,
  accent,
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
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีนี้ไม่มีสิทธิ์เข้าใช้งานหน้านี้");
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

  return (
    <Card className={`mx-auto max-w-lg ${styles.card}`}>
      <div className="space-y-3">
        <p className={`text-sm font-bold uppercase tracking-[0.24em] ${styles.hint}`}>
          Portal Login
        </p>
        <CardTitle className="text-[1.9rem]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>

      {rememberedLogins.length > 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-white/70 bg-white/80 p-5">
          <p className="text-base font-bold text-slate-950">บัญชีที่ใช้บ่อยในเครื่องนี้</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            กดเลือกบัญชีก่อน แล้วค่อยกรอกรหัสผ่านเพื่อเข้าสู่ระบบ
          </p>
          <div className="mt-4 grid gap-3">
            {rememberedLogins.map((item) => (
              <button
                key={`${item.portal}-${item.email}`}
                type="button"
                onClick={() => handlePickRememberedLogin(item.email)}
                className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <p className="text-base font-bold text-slate-950">{item.email}</p>
                <p className="mt-1 text-sm text-slate-500">
                  ใช้ในพอร์ทัลนี้แล้ว {item.usageCount} ครั้ง
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  ใช้ล่าสุด {formatDate(item.lastUsedAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-[1.6rem] border border-white/70 bg-white/80 p-5">
        <p className="text-base font-bold text-slate-950">ก่อนเข้าสู่ระบบ</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          ตรวจสอบว่าใช้อีเมลและรหัสผ่านของพอร์ทัลนี้โดยตรง เพื่อให้ระบบพาไปยังหน้าที่ถูกต้องทันที
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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
          <p className="rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isPending} className={styles.button}>
          {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
      </form>
    </Card>
  );
}
