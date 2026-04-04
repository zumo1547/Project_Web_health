import { Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  buildAccessibleElderlyWhere,
  clinicianRoles,
  permissionErrorToResponse,
  requireRole,
  requireSession,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { elderlySchema } from "@/lib/validations";

async function findDoctorByEmail(email?: string) {
  if (!email) return null;

  return prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      role: Role.DOCTOR,
    },
  });
}

async function findElderlyUserByEmail(email?: string) {
  if (!email) return null;

  return prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      role: Role.ELDERLY,
    },
  });
}

export async function GET() {
  try {
    const session = await requireSession();
    const where = buildAccessibleElderlyWhere(session.user.id, session.user.role);

    const elderly = await prisma.elderlyProfile.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        bloodPressures: {
          orderBy: {
            measuredAt: "desc",
          },
          take: 1,
        },
        aiScans: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        doctors: {
          select: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        elderlyUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

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

export async function POST(req: Request) {
  try {
    const session = await requireRole(clinicianRoles);
    const body = await req.json();
    const parsed = elderlySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if (parsed.data.nationalId) {
      const existingNationalId = await prisma.elderlyProfile.findUnique({
        where: {
          nationalId: parsed.data.nationalId,
        },
      });

      if (existingNationalId) {
        return Response.json(
          { error: "เลขบัตรประชาชนนี้ถูกใช้งานแล้ว" },
          { status: 409 },
        );
      }
    }

    const [doctorUser, elderlyUser] = await Promise.all([
      findDoctorByEmail(parsed.data.doctorEmail),
      findElderlyUserByEmail(parsed.data.elderlyEmail),
    ]);

    if (parsed.data.doctorEmail && !doctorUser) {
      return Response.json(
        { error: "ไม่พบอีเมลคุณหมอในระบบ" },
        { status: 404 },
      );
    }

    if (parsed.data.elderlyEmail && !elderlyUser) {
      return Response.json(
        { error: "ไม่พบบัญชีผู้สูงอายุในระบบ" },
        { status: 404 },
      );
    }

    if (elderlyUser?.id) {
      const existingLink = await prisma.elderlyProfile.findFirst({
        where: {
          elderlyUserId: elderlyUser.id,
        },
      });

      if (existingLink) {
        return Response.json(
          { error: "บัญชีผู้สูงอายุนี้ถูกเชื่อมกับเคสอื่นแล้ว" },
          { status: 409 },
        );
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const elderly = await tx.elderlyProfile.create({
        data: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          nationalId: parsed.data.nationalId,
          elderlyUserId: elderlyUser?.id,
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

      const doctorIds = new Set<string>();

      if (session.user.role === Role.DOCTOR) {
        doctorIds.add(session.user.id);
      }

      if (doctorUser?.id) {
        doctorIds.add(doctorUser.id);
      }

      if (doctorIds.size > 0) {
        await tx.doctorPatient.createMany({
          data: Array.from(doctorIds).map((doctorId) => ({
            doctorId,
            elderlyId: elderly.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.elderlyProfile.findUniqueOrThrow({
        where: {
          id: elderly.id,
        },
        include: {
          doctors: {
            select: {
              doctor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          elderlyUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE_ELDERLY_PROFILE",
      entityType: "ElderlyProfile",
      entityId: created.id,
      meta: {
        firstName: created.firstName,
        lastName: created.lastName,
        elderlyUserId: created.elderlyUser?.id,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถสร้างข้อมูลผู้สูงอายุได้" },
      { status: 500 },
    );
  }
}
