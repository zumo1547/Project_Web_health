import bcrypt from "bcrypt";

import { auth } from "@/auth";
import { CaseStatus, Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

const adminAssignableRoles = new Set<Role>([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]);

type ManagedRegisterData = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

type ElderlySelfRegisterData = {
  titlePrefix: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  birthDate: string;
  password: string;
  role: Role;
};

function buildDisplayName(titlePrefix: string, firstName: string, lastName: string) {
  return [titlePrefix.trim(), firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);

  return {
    firstName: firstName || "ผู้ใช้",
    lastName: rest.join(" ") || "-",
  };
}

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function isManagedRegistration(
  data: ManagedRegisterData | ElderlySelfRegisterData,
): data is ManagedRegisterData {
  return typeof data === "object" && data !== null && "name" in data;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const payload = parsed.data as ManagedRegisterData | ElderlySelfRegisterData;
    const isAdmin = session?.user?.role === Role.ADMIN;
    const isManagedMode = isManagedRegistration(payload);
    const requestedRole = isAdmin ? payload.role : Role.ELDERLY;

    if (!adminAssignableRoles.has(requestedRole)) {
      return Response.json(
        { error: "ไม่สามารถสร้างบทบาทนี้ได้" },
        { status: 400 },
      );
    }

    const normalizedEmail = payload.email.toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return Response.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const displayName = isManagedMode
      ? payload.name.trim()
      : buildDisplayName(payload.titlePrefix, payload.firstName, payload.lastName);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: displayName,
          email: normalizedEmail,
          passwordHash,
          role: requestedRole,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (requestedRole === Role.ELDERLY) {
        const profile = isManagedMode
          ? {
              ...splitName(payload.name),
              titlePrefix: null,
              gender: null,
              birthDate: null,
              phone: null,
              onboardingRequired: true,
              profileCompletedAt: null,
              notes: "สร้างแฟ้มโดยผู้ดูแลระบบ กรุณากรอกข้อมูลเพิ่มเติมภายหลัง",
            }
          : {
              firstName: payload.firstName,
              lastName: payload.lastName,
              titlePrefix: payload.titlePrefix,
              gender: payload.gender,
              birthDate: toDateOnly(payload.birthDate),
              phone: payload.phone.replace(/\D/g, ""),
              onboardingRequired: false,
              profileCompletedAt: new Date(),
              notes: "สร้างแฟ้มอัตโนมัติจากการสมัครสมาชิกผู้สูงอายุ",
            };

        await tx.elderlyProfile.create({
          data: {
            elderlyUserId: createdUser.id,
            titlePrefix: profile.titlePrefix,
            firstName: profile.firstName,
            lastName: profile.lastName,
            birthDate: profile.birthDate,
            gender: profile.gender,
            phone: profile.phone,
            caseStatus: CaseStatus.SELF_SERVICE,
            onboardingRequired: profile.onboardingRequired,
            profileCompletedAt: profile.profileCompletedAt,
            notes: profile.notes,
          },
        });
      }

      return createdUser;
    });

    await writeAuditLog({
      userId: session?.user?.id,
      action: isAdmin ? "REGISTER_USER_FROM_ADMIN" : "SELF_REGISTER_ELDERLY",
      entityType: "USER",
      entityId: user.id,
      meta: {
        detail: `${isAdmin ? "แอดมิน" : "ผู้ใช้งานทั่วไป"}สร้างบัญชี ${user.email} (${user.role})`,
      },
    });

    return Response.json(
      {
        user,
        message: isAdmin ? "สร้างบัญชีสำเร็จ" : "สมัครสมาชิกสำเร็จ",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("register failed", error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
