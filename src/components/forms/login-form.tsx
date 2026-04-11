"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatSystemDateTime } from "@/lib/date-time";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useState, useTransition } from "react";

type LoginPortal = "USER" | "DOCTOR" | "ADMIN";
type SocialProvider = "google" | "facebook";

type LoginFormProps = {
  defaultCallbackUrl: string;
  portal: LoginPortal;
  title: string;
  description: string;
  accent: "user" | "doctor" | "admin";
  socialProviders?: SocialProvider[];
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
  return formatSystemDateTime(value);
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 3.1-4.2 3.1-7.1Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5- .9 6.7-2.6l-3.1-2.4c-.9.6-2.1 1-3.6 1-2.7 0-5-1.8-5.8-4.3H3v2.5A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.2 13.7A6 6 0 0 1 5.9 12c0-.6.1-1.2.3-1.7V7.8H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.5l3.2-2.8Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.4l2.8-2.8A10 10 0 0 0 3 7.8l3.2 2.5C7 7.8 9.3 6 12 6Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.8v-8.3H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.3A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
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
}: LoginFormProps) {
  const router = useRouter();
  const passwordInputId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberedLogins, setRememberedLogins] = useState<RememberedLogin[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSocialPending, setIsSocialPending] = useState<SocialProvider | null>(null);
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

  async function handleSocialSignIn(provider: SocialProvider) {
    try {
      setError("");
      setIsSocialPending(provider);

      await signIn(provider, {
        callbackUrl: defaultCallbackUrl,
      });
    } catch {
      setError("ไม่สามารถเริ่มการเข้าสู่ระบบผ่านบัญชีภายนอกได้ในตอนนี้");
      setIsSocialPending(null);
    }
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

  return (
    <Card className={`mx-auto max-w-lg ${styles.card}`}>
      <div className="space-y-3">
        <p className={`text-sm font-bold uppercase tracking-[0.24em] ${styles.hint}`}>
          Portal Login
        </p>
        <CardTitle className="text-[1.9rem]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>

      {showSocialLogin ? (
        <div className="mt-6 rounded-[1.6rem] border border-white/70 bg-white/80 p-5">
          <p className="text-base font-bold text-slate-950">
            เข้าระบบด้วย Google หรือ Facebook
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            เหมาะกับการเริ่มใช้งานเร็ว หลังล็อกอินครั้งแรกระบบจะพาไปกรอกข้อมูลทั่วไปของผู้สูงอายุให้ครบก่อนเข้าแอป
          </p>
          <div className="mt-4 grid gap-3">
            {socialProviders.includes("google") ? (
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => handleSocialSignIn("google")}
                disabled={Boolean(isSocialPending)}
                className="justify-start gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 text-slate-900 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <GoogleIcon />
                {isSocialPending === "google"
                  ? "กำลังพาไปยัง Google..."
                  : "เข้าสู่ระบบด้วย Google"}
              </Button>
            ) : null}

            {socialProviders.includes("facebook") ? (
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => handleSocialSignIn("facebook")}
                disabled={Boolean(isSocialPending)}
                className="justify-start gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 text-slate-900 hover:border-sky-200 hover:bg-sky-50"
              >
                <FacebookIcon />
                {isSocialPending === "facebook"
                  ? "กำลังพาไปยัง Facebook..."
                  : "เข้าสู่ระบบด้วย Facebook"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {rememberedLogins.length > 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-white/70 bg-white/80 p-5">
          <p className="text-base font-bold text-slate-950">
            บัญชีที่ใช้บ่อยในเครื่องนี้
          </p>
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
        <p className="text-base font-bold text-slate-950">เข้าสู่ระบบด้วยอีเมล</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          ถ้ามีบัญชีเดิมอยู่แล้ว สามารถใช้อีเมลและรหัสผ่านเดิมเข้าได้ตามปกติ
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

        <Button type="submit" fullWidth disabled={isPending || Boolean(isSocialPending)} className={styles.button}>
          {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
      </form>
    </Card>
  );
}
