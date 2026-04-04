import { DoctorCaseStatus, Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
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

    const updated = await prisma.elderlyProfile.update({
      where: { id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        nationalId: parsed.data.nationalId,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : undefined,
        gender: parsed.data.gender,
        phone: parsed.data.phone,
        address: parsed.data.address,
        allergies: parsed.data.allergies,
        chronicDiseases: parsed.data.chronicDiseases,
        notes: parsed.data.notes,
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
