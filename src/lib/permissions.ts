import { auth } from "@/auth";
import {
  CaseStatus,
  DoctorCaseStatus,
  Prisma,
  Role,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type LoginPortal = "USER" | "DOCTOR" | "ADMIN";

export const clinicianRoles: Role[] = [Role.ADMIN, Role.DOCTOR];
export const userPortalRoles: Role[] = [Role.ELDERLY];

export const roleLabels: Record<Role, string> = {
  ADMIN: "แอดมิน",
  DOCTOR: "คุณหมอ",
  CAREGIVER: "บัญชีเดิม",
  ELDERLY: "ผู้สูงอายุ",
};

export function canAccessAdminPortal(role: Role) {
  return role === Role.ADMIN;
}

export function canAccessDoctorPortal(role: Role) {
  return role === Role.ADMIN || role === Role.DOCTOR;
}

export function canAccessElderlyPortal(role: Role) {
  return role === Role.ELDERLY;
}

export function getDefaultPortalPath(role: Role) {
  if (canAccessAdminPortal(role)) {
    return "/admin";
  }

  if (role === Role.DOCTOR) {
    return "/doctor";
  }

  if (role === Role.ELDERLY) {
    return "/elderly-portal";
  }

  return "/";
}

export function canLoginToPortal(role: Role, portal: LoginPortal) {
  if (portal === "ADMIN") {
    return role === Role.ADMIN;
  }

  if (portal === "DOCTOR") {
    return role === Role.DOCTOR;
  }

  return role === Role.ELDERLY;
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();

  if (!roles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export function buildAccessibleElderlyWhere(
  userId: string,
  role: Role,
): Prisma.ElderlyProfileWhereInput {
  if (role === Role.ADMIN) {
    return {};
  }

  if (role === Role.DOCTOR) {
    return {
      doctors: {
        some: {
          doctorId: userId,
        },
      },
    };
  }

  if (role === Role.ELDERLY) {
    return {
      elderlyUserId: userId,
    };
  }

  if (role === Role.CAREGIVER) {
    return {
      caregivers: {
        some: {
          caregiverId: userId,
        },
      },
    };
  }

  return {
    id: "__no_access__",
  };
}

export async function assertElderlyAccess(elderlyId: string) {
  const session = await requireSession();

  if (session.user.role === Role.ADMIN) {
    return session;
  }

  const count = await prisma.elderlyProfile.count({
    where: {
      id: elderlyId,
      ...buildAccessibleElderlyWhere(session.user.id, session.user.role),
    },
  });

  if (!count) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function assertElderlyReadAccess(elderlyId: string) {
  const session = await requireSession();

  if (session.user.role === Role.ADMIN || session.user.role === Role.ELDERLY) {
    return assertElderlyAccess(elderlyId);
  }

  if (session.user.role !== Role.DOCTOR) {
    throw new Error("FORBIDDEN");
  }

  const count = await prisma.elderlyProfile.count({
    where: {
      id: elderlyId,
      OR: [
        {
          caseStatus: CaseStatus.WAITING_DOCTOR,
        },
        {
          doctors: {
            some: {
              doctorId: session.user.id,
              status: DoctorCaseStatus.ACTIVE,
            },
          },
        },
      ],
    },
  });

  if (!count) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export function permissionErrorToResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return Response.json(
      { error: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
      { status: 401 },
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return Response.json(
      { error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้" },
      { status: 403 },
    );
  }

  return null;
}
