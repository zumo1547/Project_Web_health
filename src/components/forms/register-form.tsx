"use client";

import Link from "next/link";
import { FormEvent, useId, useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type UserRole = "ADMIN" | "DOCTOR" | "ELDERLY";

type RegisterFormProps = {
  defaultRole?: UserRole;
  allowedRoles?: UserRole[];
  showRoleSelect?: boolean;
  autoSignIn?: boolean;
  callbackUrl?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
};

function collectErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const values = Object.values(error as Record<string, unknown>);
    for (const value of values) {
      if (Array.isArray(value)) {
        const text = value.find((item) => typeof item === "string");
        if (typeof text === "string") {
          return text;
        }
      }
    }
  }

  return "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

function roleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "แอดมิน";
    case "DOCTOR":
      return "คุณหมอ";
    default:
      return "ผู้สูงอายุ";
  }
}

export function RegisterForm({
  defaultRole = "ELDERLY",
  allowedRoles = ["ELDERLY"],
  showRoleSelect = false,
  autoSignIn = true,
  callbackUrl = "/complete-profile",
  title = "สมัครสมาชิกผู้สูงอายุ",
  description = "กรอกข้อมูลที่จำเป็นก่อน แล้วระบบจะพาไปกรอกข้อมูลทั่วไปในขั้นตอนถัดไป",
  submitLabel = "สมัครสมาชิกและเริ่มใช้งาน",
  className = "",
}: RegisterFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const termsId = useId();
  const errorId = useId();
  const messageId = useId();
  const passwordGuideId = useId();

  const isManagedMode = showRoleSelect;

  const passwordChecks = useMemo(
    () => [
      { label: "อย่างน้อย 8 ตัวอักษร", passed: password.length >= 8 },
      { label: "มีตัวพิมพ์ใหญ่ A-Z อย่างน้อย 1 ตัว", passed: /[A-Z]/.test(password) },
      { label: "มีตัวพิมพ์เล็ก a-z อย่างน้อย 1 ตัว", passed: /[a-z]/.test(password) },
      { label: "มีตัวเลขอย่างน้อย 1 ตัว", passed: /\d/.test(password) },
      { label: "มีอักขระพิเศษอย่างน้อย 1 ตัว", passed: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  const passwordReady = passwordChecks.every((item) => item.passed);

  function resetLocalState() {
    setPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!passwordReady) {
      setError("กรุณาตั้งรหัสผ่านให้ผ่านเงื่อนไขความปลอดภัยก่อน");
      return;
    }

    startTransition(async () => {
      try {
        const payload = isManagedMode
          ? {
              name: String(formData.get("name") ?? "").trim(),
              email: String(formData.get("email") ?? "").trim().toLowerCase(),
              password,
              role,
            }
          : {
              name: String(formData.get("fullName") ?? "").trim(),
              email: String(formData.get("email") ?? "").trim().toLowerCase(),
              password,
              role: "ELDERLY" as const,
            };

        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(collectErrorMessage(result?.error));
        }

        if (autoSignIn) {
          const loginResult = await signIn("credentials", {
            email: payload.email,
            password,
            portal: "USER",
            redirect: false,
            callbackUrl,
          });

          if (loginResult?.error) {
            setMessage("สมัครสำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านอีกครั้ง");
            router.push("/login");
            return;
          }

          form.reset();
          resetLocalState();
          router.push(callbackUrl);
          router.refresh();
          return;
        }

        form.reset();
        resetLocalState();
        setRole(defaultRole);
        setMessage(`สร้างบัญชี${roleLabel(role)}สำเร็จแล้ว`);
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        );
      }
    });
  }

  return (
    <Card className={`w-full rounded-[2rem] p-5 sm:p-6 md:p-7 ${className}`}>
      <header className="space-y-2">
        <CardTitle className="text-[1.95rem] sm:text-[2.1rem]">{title}</CardTitle>
        <CardDescription className="text-base leading-7">{description}</CardDescription>
      </header>

      <section className="mt-5 rounded-[1.45rem] border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
        <h2 className="text-lg font-bold text-slate-900">สมัครแล้วจะเกิดอะไรต่อ?</h2>
        <ol className="mt-2 space-y-2 text-sm leading-7 text-slate-700">
          <li>1. ระบบสร้างบัญชีและเข้าสู่ระบบให้อัตโนมัติ</li>
          <li>2. พาไปหน้ากรอกข้อมูลทั่วไปเพื่อเตรียมใช้งานแอป</li>
          <li>3. จากนั้นเริ่มบันทึกความดัน รูปยา และติดต่อนัดหมายได้ทันที</li>
        </ol>
      </section>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
        {isManagedMode ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={fullNameId} className="block text-base font-bold text-slate-700">
                  ชื่อที่แสดง
                </label>
                <Input
                  id={fullNameId}
                  name="name"
                  placeholder="เช่น นพ.สมชาย ใจดี"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-base font-bold text-slate-700">บทบาท</label>
                <Select
                  name="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  required
                >
                  {allowedRoles.map((item) => (
                    <option key={item} value={item}>
                      {roleLabel(item)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={emailId} className="block text-base font-bold text-slate-700">
                อีเมล
              </label>
              <Input
                id={emailId}
                type="email"
                name="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor={fullNameId} className="block text-base font-bold text-slate-700">
                ชื่อ-นามสกุล
              </label>
              <Input
                id={fullNameId}
                name="fullName"
                placeholder="เช่น สมใจ ใจดี"
                required
                autoComplete="name"
              />
              <p className="text-sm text-slate-500">
                ใช้ชื่อจริงเพื่อให้ระบบและคุณหมอแสดงข้อมูลได้ถูกต้อง
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor={emailId} className="block text-base font-bold text-slate-700">
                อีเมล
              </label>
              <Input
                id={emailId}
                type="email"
                name="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
              <p className="text-sm text-slate-500">
                ใช้อีเมลนี้สำหรับเข้าสู่ระบบในครั้งถัดไป
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={passwordId} className="block text-base font-bold text-slate-700">
              รหัสผ่าน
            </label>
            <Input
              id={passwordId}
              type="password"
              name="password"
              placeholder="ตั้งรหัสผ่านที่ปลอดภัย"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={passwordGuideId}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor={confirmPasswordId}
              className="block text-base font-bold text-slate-700"
            >
              ยืนยันรหัสผ่าน
            </label>
            <Input
              id={confirmPasswordId}
              type="password"
              name="confirmPassword"
              placeholder="พิมพ์รหัสผ่านอีกครั้ง"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>

        <div
          id={passwordGuideId}
          className="rounded-[1.2rem] border border-slate-200 bg-slate-50/85 p-4"
        >
          <p className="text-sm font-bold text-slate-900">ตรวจสอบความปลอดภัยของรหัสผ่าน</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {passwordChecks.map((item) => (
              <p
                key={item.label}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  item.passed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {item.label}
              </p>
            ))}
          </div>
        </div>

        {!isManagedMode ? (
          <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
            <label htmlFor={termsId} className="flex items-start gap-3">
              <input
                id={termsId}
                name="acceptTerms"
                type="checkbox"
                required
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-sm leading-7 text-slate-700">
                ข้าพเจ้ายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว เพื่อให้ระบบจัดเก็บข้อมูลสุขภาพสำหรับการใช้งานในแอปนี้
              </span>
            </label>
          </div>
        ) : null}

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700"
          >
            {error}
          </p>
        ) : null}

        {message ? (
          <p
            id={messageId}
            role="status"
            className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700"
          >
            {message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "กำลังสร้างบัญชี..." : submitLabel}
        </Button>
      </form>

      {!isManagedMode ? (
        <section className="mt-5 rounded-[1.45rem] border border-slate-200 bg-slate-50/85 p-4">
          <h2 className="text-base font-bold text-slate-900">มีบัญชีอยู่แล้ว?</h2>
          <p className="mt-1 text-sm leading-7 text-slate-600">
            กลับไปหน้าเข้าสู่ระบบเพื่อใช้งานด้วยอีเมลและรหัสผ่านเดิมได้ทันที
          </p>
          <div className="mt-3">
            <Link
              href="/login"
              className="inline-flex min-h-[2.9rem] items-center rounded-[1rem] border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </section>
      ) : null}
    </Card>
  );
}
