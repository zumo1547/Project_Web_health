"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
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

const prefixOptions = ["นาย", "นาง", "นางสาว", "คุณ", "ดร."];

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

  return "สมัครสมาชิกไม่สำเร็จ";
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
  callbackUrl = "/elderly-portal",
  title = "สร้างบัญชีผู้สูงอายุ",
  description = "กรอกข้อมูลพื้นฐานให้ครบ เพื่อเริ่มใช้งานแฟ้มสุขภาพส่วนตัวได้ทันที",
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

  const isManagedMode = showRoleSelect;

  const passwordChecks = useMemo(
    () => [
      { label: "อย่างน้อย 8 ตัวอักษร", passed: password.length >= 8 },
      { label: "มีตัวพิมพ์ใหญ่ภาษาอังกฤษ", passed: /[A-Z]/.test(password) },
      { label: "มีตัวพิมพ์เล็กภาษาอังกฤษ", passed: /[a-z]/.test(password) },
      { label: "มีตัวเลขอย่างน้อย 1 ตัว", passed: /\d/.test(password) },
      {
        label: "มีอักขระพิเศษอย่างน้อย 1 ตัว",
        passed: /[^A-Za-z0-9]/.test(password),
      },
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
      setError("กรุณายืนยันรหัสผ่านให้ตรงกัน");
      return;
    }

    if (!passwordReady) {
      setError("กรุณาตั้งรหัสผ่านให้ปลอดภัยตามเงื่อนไขที่กำหนด");
      return;
    }

    startTransition(async () => {
      try {
        const payload = isManagedMode
          ? {
              name: String(formData.get("name") ?? "").trim(),
              email: String(formData.get("email") ?? "").trim(),
              password,
              role,
            }
          : {
              titlePrefix: String(formData.get("titlePrefix") ?? "").trim(),
              firstName: String(formData.get("firstName") ?? "").trim(),
              lastName: String(formData.get("lastName") ?? "").trim(),
              email: String(formData.get("email") ?? "").trim(),
              phone: String(formData.get("phone") ?? "").trim(),
              gender: String(formData.get("gender") ?? ""),
              birthDate: String(formData.get("birthDate") ?? ""),
              password,
              role,
            };

        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            collectErrorMessage(result?.error) ||
              "สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง",
          );
        }

        if (autoSignIn) {
          const loginResult = await signIn("credentials", {
            email: payload.email,
            password,
            portal: "USER",
            redirect: false,
          });

          if (loginResult?.error) {
            throw new Error("สร้างบัญชีสำเร็จ แต่เข้าสู่ระบบอัตโนมัติไม่สำเร็จ");
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
            : "สมัครสมาชิกไม่สำเร็จ",
        );
      }
    });
  }

  return (
    <Card className={`w-full max-w-[42rem] space-y-6 ${className}`}>
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {isManagedMode ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">ชื่อที่ใช้แสดง</span>
                <Input
                  name="name"
                  placeholder="เช่น นพ.สมชาย ใจดี"
                  required
                  autoComplete="name"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">บทบาท</span>
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
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">อีเมล</span>
              <Input
                type="email"
                name="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                ข้อมูลนี้จะใช้สร้างแฟ้มสุขภาพส่วนตัวของผู้สูงอายุ
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/75">
                กรอกชื่อจริง เบอร์มือถือ และวันเกิดให้ครบ เพื่อให้คุณหมอและระบบติดตามสุขภาพแสดงข้อมูลได้ถูกต้อง
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">คำนำหน้า</span>
                <Select name="titlePrefix" defaultValue={prefixOptions[0]} required>
                  {prefixOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">เพศ</span>
                <Select name="gender" defaultValue="FEMALE" required>
                  <option value="MALE">ชาย</option>
                  <option value="FEMALE">หญิง</option>
                  <option value="OTHER">ไม่ระบุ / อื่น ๆ</option>
                </Select>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">ชื่อ</span>
                <Input
                  name="firstName"
                  placeholder="เช่น สมใจ"
                  required
                  autoComplete="given-name"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">นามสกุล</span>
                <Input
                  name="lastName"
                  placeholder="เช่น ใจดี"
                  required
                  autoComplete="family-name"
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">เบอร์มือถือ</span>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="0812345678"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">วันเกิด</span>
                <Input type="date" name="birthDate" required />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">อีเมล</span>
              <Input
                type="email"
                name="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </label>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">รหัสผ่าน</span>
            <Input
              type="password"
              name="password"
              placeholder="ตั้งรหัสผ่านที่ปลอดภัย"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่าน</span>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="พิมพ์รหัสผ่านอีกครั้ง"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </div>

        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-900">ตั้งรหัสผ่านให้ปลอดภัย</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {passwordChecks.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  item.passed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "กำลังบันทึกข้อมูล..." : submitLabel}
        </Button>
      </form>

      {!isManagedMode ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/85 p-4">
          <p className="text-sm font-semibold text-slate-900">มีบัญชีอยู่แล้วใช่ไหม?</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            หากเคยสมัครไว้แล้ว สามารถกลับไปเข้าสู่ระบบด้วยอีเมลเดิมเพื่อเริ่มบันทึกข้อมูลสุขภาพได้ทันที
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-[1.1rem] border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
