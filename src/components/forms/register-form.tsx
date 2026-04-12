"use client";

import {
  SocialAuthButtons,
  type SocialProvider,
} from "@/components/forms/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type UserRole = "ADMIN" | "DOCTOR" | "ELDERLY";

type RegisterFormProps = {
  allowedRoles?: UserRole[];
  defaultRole?: UserRole;
  showRoleSelect?: boolean;
  autoSignIn?: boolean;
  callbackUrl?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
  socialProviders?: SocialProvider[];
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "แอดมิน",
  DOCTOR: "คุณหมอ",
  ELDERLY: "ผู้สูงอายุ",
};

export function RegisterForm({
  allowedRoles = ["ELDERLY"],
  defaultRole = allowedRoles[0] ?? "ELDERLY",
  showRoleSelect = false,
  autoSignIn = true,
  callbackUrl = "/elderly-portal",
  title = "สร้างบัญชีผู้ใช้งาน",
  description = "สมัครบัญชีผู้สูงอายุเพื่อเข้าใช้งานระบบได้ทันที",
  submitLabel = "สร้างบัญชี",
  className = "",
  socialProviders = [],
}: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? defaultRole),
    };

    setError("");
    setMessage("");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        typeof result.error === "string" ? result.error : "สมัครสมาชิกไม่สำเร็จ",
      );
      return;
    }

    if (autoSignIn) {
      await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        portal: "USER",
        redirect: false,
      });

      startTransition(() => {
        router.push(callbackUrl);
        router.refresh();
      });

      return;
    }

    form.reset();
    setMessage(`สร้างบัญชี ${result.name} สำเร็จแล้ว`);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card
      className={`mx-auto w-full max-w-[36rem] rounded-[2.4rem] border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.97)_100%)] ${className}`}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
            Create Account
          </p>
          <span className="rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            เริ่มใช้งานได้ในไม่กี่ขั้นตอน
          </span>
        </div>
        <CardTitle className="text-[1.9rem] sm:text-[2.15rem]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>

      {socialProviders.length > 0 ? (
        <div className="mt-6">
          <SocialAuthButtons
            providers={socialProviders}
            callbackUrl={callbackUrl}
            title="สมัครเร็วด้วย Google หรือ Facebook"
            description="เหมาะกับผู้สูงอายุหรือครอบครัวที่อยากเริ่มใช้งานทันที หลังเข้าสู่ระบบครั้งแรก ระบบจะพาไปกรอกข้อมูลพื้นฐานต่อให้ครบ"
          />
        </div>
      ) : null}

      <div className="mt-6 rounded-[1.7rem] border border-white/70 bg-white/80 p-5 sm:p-6">
        <p className="text-base font-bold text-slate-950">ข้อมูลที่ต้องใช้</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          ใช้เพียงชื่อที่ต้องการแสดง อีเมล และรหัสผ่าน หลังสมัครเสร็จระบบจะพาเข้าสู่หน้าผู้สูงอายุให้อัตโนมัติ
        </p>
      </div>

      <form
        className={`mt-6 grid gap-5 ${showRoleSelect ? "md:grid-cols-2" : ""}`}
        onSubmit={handleSubmit}
      >
        <label className={`space-y-2 ${showRoleSelect ? "md:col-span-2" : ""}`}>
          <span className="text-sm font-bold text-slate-700">ชื่อที่แสดง</span>
          <Input name="name" placeholder="เช่น สมใจ ใจดี" required />
        </label>

        <label className={`space-y-2 ${showRoleSelect ? "md:col-span-2" : ""}`}>
          <span className="text-sm font-bold text-slate-700">อีเมล</span>
          <Input name="email" type="email" placeholder="name@example.com" required />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">รหัสผ่าน</span>
          <Input
            name="password"
            type="password"
            minLength={8}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            required
          />
        </label>

        {showRoleSelect ? (
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">บทบาท</span>
            <Select name="role" defaultValue={defaultRole}>
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </Select>
          </label>
        ) : (
          <input type="hidden" name="role" value={defaultRole} />
        )}

        {error ? (
          <p
            className={`rounded-[1.3rem] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700 ${showRoleSelect ? "md:col-span-2" : ""}`}
          >
            {error}
          </p>
        ) : null}

        {message ? (
          <p
            className={`rounded-[1.3rem] bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700 ${showRoleSelect ? "md:col-span-2" : ""}`}
          >
            {message}
          </p>
        ) : null}

        <div className={showRoleSelect ? "md:col-span-2" : ""}>
          <Button type="submit" fullWidth disabled={isPending}>
            {isPending ? "กำลังสร้างบัญชี..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
