import { DoctorCaseStatus, Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasCompletedGeneralProfile } from "@/lib/elderly-profile";
import {
  assertElderlyAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { elderlyUpdateSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyAccess(id);

    const elderly = await prisma.elderlyProfile.findUnique({
      where: { id },
      include: {
        bloodPressures: {
          orderBy: {
            measuredAt: "desc",
          },
        },
        medicineImages: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
        aiScans: {
          orderBy: {
            createdAt: "desc",
          },
        },
        doctors: {
          where: {
            status: DoctorCaseStatus.ACTIVE,
          },
          select: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            status: true,
            createdAt: true,
          },
        },
        aiHealthMessages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!elderly) {
      return Response.json({ error: "ไม่พบข้อมูลผู้สูงอายุ" }, { status: 404 });
    }

    return Response.json(elderly);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถโหลดข้อมูลผู้สูงอายุได้" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]);
    await assertElderlyAccess(id);

    const body = await req.json();
    const parsed = elderlyUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.elderlyProfile.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        phone: true,
      },
    });

    if (!existing) {
      return Response.json({ error: "ไม่พบข้อมูลผู้สูงอายุ" }, { status: 404 });
    }

    const nextProfile = {
      firstName: parsed.data.firstName ?? existing.firstName,
      lastName: parsed.data.lastName ?? existing.lastName,
      birthDate:
        parsed.data.birthDate === undefined
          ? existing.birthDate
          : parsed.data.birthDate
            ? new Date(parsed.data.birthDate)
            : null,
      phone: parsed.data.phone ?? existing.phone,
    };

    const isProfileComplete = hasCompletedGeneralProfile(nextProfile);

    const updated = await prisma.elderlyProfile.update({
      where: { id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        nationalId: parsed.data.nationalId,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : parsed.data.birthDate === undefined
            ? undefined
            : null,
        gender:
          parsed.data.gender === undefined ? undefined : parsed.data.gender ?? null,
        phone:
          parsed.data.phone === undefined ? undefined : parsed.data.phone ?? null,
        address:
          parsed.data.address === undefined ? undefined : parsed.data.address ?? null,
        allergies:
          parsed.data.allergies === undefined
            ? undefined
            : parsed.data.allergies ?? null,
        chronicDiseases:
          parsed.data.chronicDiseases === undefined
            ? undefined
            : parsed.data.chronicDiseases ?? null,
        notes: parsed.data.notes === undefined ? undefined : parsed.data.notes ?? null,
        onboardingRequired: isProfileComplete ? false : undefined,
        profileCompletedAt: isProfileComplete ? new Date() : undefined,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE_ELDERLY_PROFILE",
      entityType: "ElderlyProfile",
      entityId: updated.id,
      meta: parsed.data,
    });

    return Response.json(updated);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถอัปเดตข้อมูลผู้สูงอายุได้" },
      { status: 500 },
    );
  }
}
