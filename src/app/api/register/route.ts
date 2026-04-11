import bcrypt from "bcrypt";
import { auth } from "@/auth";
import { CaseStatus, Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

const adminAssignableRoles = new Set<Role>([
  Role.ADMIN,
  Role.DOCTOR,
  Role.ELDERLY,
]);

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: "ผู้ใช้",
      lastName: "ใหม่",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "ผู้ใช้งาน",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
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

    const isAdmin = session?.user?.role === Role.ADMIN;
    const requestedRole = isAdmin ? parsed.data.role : Role.ELDERLY;

    if (!adminAssignableRoles.has(requestedRole)) {
      return Response.json(
        { error: "ไม่สามารถสร้างบทบาทนี้ได้" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (existing) {
      return Response.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const names = splitDisplayName(parsed.data.name);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
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
        await tx.elderlyProfile.create({
          data: {
            elderlyUserId: createdUser.id,
            firstName: names.firstName,
            lastName: names.lastName,
            caseStatus: CaseStatus.SELF_SERVICE,
            onboardingRequired: false,
            profileCompletedAt: new Date(),
            notes: "สร้างแฟ้มอัตโนมัติจากการสมัครบัญชี",
          },
        });
      }

      return createdUser;
    });

    await writeAuditLog({
      userId: session?.user?.id ?? user.id,
      action: "REGISTER_USER",
      entityType: "User",
      entityId: user.id,
      meta: {
        role: user.role,
        email: user.email,
        createdByRole: session?.user?.role ?? "SELF_SERVICE",
      },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
