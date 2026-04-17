"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export type SocialProvider = "google" | "facebook" | "line";

type SocialAuthButtonsProps = {
  providers: SocialProvider[];
  callbackUrl: string;
  title: string;
  description: string;
  tone?: "emerald" | "sky";
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 3.1-4.2 3.1-7.1Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.6l-3.1-2.4c-.9.6-2.1 1-3.6 1-2.7 0-5-1.8-5.8-4.3H3v2.5A10 10 0 0 0 12 22Z"
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

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#06C755"
        d="M12 2C6.5 2 2 5.8 2 10.5c0 4.2 3.6 7.7 8.4 8.4v3.1c0 .3.3.5.6.3l3.7-2.2c5-.8 8.7-4.2 8.7-8.5C23.4 5.8 18.9 2 13.4 2H12Z"
      />
      <path
        fill="#FFFFFF"
        d="M8.2 9.1h1.1v3.2h1.7v1H8.2V9.1Zm3.2 0h1.1v4.2h-1.1V9.1Zm2.2 0h1l1.6 2.2V9.1h1.1v4.2h-1l-1.6-2.2v2.2h-1.1V9.1Z"
      />
    </svg>
  );
}

const toneStyles = {
  emerald: {
    section: "border-emerald-100 bg-emerald-50/65",
    google: "hover:border-emerald-200 hover:bg-white",
    facebook: "hover:border-sky-200 hover:bg-white",
    line: "hover:border-emerald-300 hover:bg-white",
  },
  sky: {
    section: "border-sky-100 bg-sky-50/65",
    google: "hover:border-sky-200 hover:bg-white",
    facebook: "hover:border-cyan-200 hover:bg-white",
    line: "hover:border-emerald-300 hover:bg-white",
  },
};

export function SocialAuthButtons({
  providers,
  callbackUrl,
  title,
  description,
  tone = "emerald",
}: SocialAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");
  const styles = toneStyles[tone];

  if (providers.length === 0) {
    return null;
  }

  async function handleSocialSignIn(provider: SocialProvider) {
    try {
      setError("");
      setPendingProvider(provider);

      await signIn(provider, {
        callbackUrl,
      });
    } catch {
      setError("ยังไม่สามารถเริ่มการเข้าสู่ระบบด้วยบัญชีภายนอกได้ในตอนนี้");
      setPendingProvider(null);
    }
  }

  return (
    <div className={`rounded-[1.7rem] border p-5 sm:p-6 ${styles.section}`}>
      <p className="text-base font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>

      <div className="mt-4 grid gap-3">
        {providers.includes("google") ? (
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => handleSocialSignIn("google")}
            disabled={Boolean(pendingProvider)}
            className={`justify-start gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 text-slate-900 ${styles.google}`}
          >
            <GoogleIcon />
            {pendingProvider === "google"
              ? "กำลังพาไปยัง Google..."
              : "เข้าสู่ระบบด้วย Google"}
          </Button>
        ) : null}

        {providers.includes("facebook") ? (
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => handleSocialSignIn("facebook")}
            disabled={Boolean(pendingProvider)}
            className={`justify-start gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 text-slate-900 ${styles.facebook}`}
          >
            <FacebookIcon />
            {pendingProvider === "facebook"
              ? "กำลังพาไปยัง Facebook..."
              : "เข้าสู่ระบบด้วย Facebook"}
          </Button>
        ) : null}

        {providers.includes("line") ? (
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => handleSocialSignIn("line")}
            disabled={Boolean(pendingProvider)}
            className={`justify-start gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 text-slate-900 ${styles.line}`}
          >
            <LineIcon />
            {pendingProvider === "line"
              ? "กำลังพาไปยัง LINE..."
              : "เข้าสู่ระบบด้วย LINE"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-[1.2rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
