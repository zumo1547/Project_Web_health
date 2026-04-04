import {
  CaseStatus,
  DoctorCaseStatus,
  Role,
} from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import { syncElderlyCaseStatus } from "@/lib/case-management";
import {
  assertElderlyAccess,
  assertElderlyReadAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { doctorCaseActionSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyReadAccess(id);

    const elderly = await prisma.elderlyProfile.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        caseStatus: true,
        doctorRequestNote: true,
        doctorRequestedAt: true,
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
              },
            },
          },
        },
      },
    });

    if (!elderly) {
      return Response.json({ error: "ไม่พบเคสผู้สูงอายุ" }, { status: 404 });
    }

    return Response.json(elderly);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถโหลดสถานะเคสได้" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]);
    const body = await req.json();
    const parsed = doctorCaseActionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const profile = await prisma.elderlyProfile.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        caseStatus: true,
      },
    });

    if (!profile) {
      return Response.json({ error: "ไม่พบเคสผู้สูงอายุ" }, { status: 404 });
    }

    const action = parsed.data.action;

    if (action === "REQUEST_DOCTOR") {
      await assertElderlyAccess(id);

      if (session.user.role !== Role.ELDERLY && session.user.role !== Role.ADMIN) {
        return Response.json({ error: "คุณไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 });
      }

      const updated = await prisma.elderlyProfile.update({
        where: { id },
        data: {
          caseStatus: CaseStatus.WAITING_DOCTOR,
          doctorRequestNote: parsed.data.requestNote,
          doctorRequestedAt: new Date(),
        },
        include: {
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
                },
              },
            },
          },
        },
      });

      await writeAuditLog({
        userId: session.user.id,
        action: "REQUEST_DOCTOR_CASE",
        entityType: "ElderlyProfile",
        entityId: id,
        meta: {
          requestNote: parsed.data.requestNote,
        },
      });

      return Response.json(updated);
    }

    if (action === "SET_SELF_SERVICE") {
      await assertElderlyAccess(id);

      if (session.user.role !== Role.ELDERLY && session.user.role !== Role.ADMIN) {
        return Response.json({ error: "คุณไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 });
      }

      const activeDoctors = await prisma.doctorPatient.count({
        where: {
          elderlyId: id,
          status: DoctorCaseStatus.ACTIVE,
        },
      });

      if (activeDoctors > 0) {
        return Response.json(
          { error: "ยังมีคุณหมอดูแลเคสนี้อยู่ กรุณาปิดเคสก่อน" },
          { status: 400 },
        );
      }

      const updated = await prisma.elderlyProfile.update({
        where: { id },
        data: {
          caseStatus: CaseStatus.SELF_SERVICE,
          doctorRequestNote: null,
          doctorRequestedAt: null,
        },
      });

      await writeAuditLog({
        userId: session.user.id,
        action: "SET_SELF_SERVICE_CASE",
        entityType: "ElderlyProfile",
        entityId: id,
      });

      return Response.json(updated);
    }

    if (action === "JOIN_SELF") {
      await assertElderlyReadAccess(id);

      if (session.user.role !== Role.DOCTOR) {
        return Response.json({ error: "คุณไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 });
      }

      await prisma.doctorPatient.upsert({
        where: {
          doctorId_elderlyId: {
            doctorId: session.user.id,
            elderlyId: id,
          },
        },
        update: {
          status: DoctorCaseStatus.ACTIVE,
          completedAt: null,
          closedNote: null,
        },
        create: {
          doctorId: session.user.id,
          elderlyId: id,
          status: DoctorCaseStatus.ACTIVE,
        },
      });

      const updated = await syncElderlyCaseStatus(id, CaseStatus.IN_REVIEW);

      await prisma.elderlyProfile.update({
        where: { id },
        data: {
          doctorRequestNote: null,
        },
      });

      await writeAuditLog({
        userId: session.user.id,
        action: "JOIN_DOCTOR_CASE",
        entityType: "ElderlyProfile",
        entityId: id,
      });

      return Response.json(updated);
    }

    if (action === "COMPLETE_SELF") {
      await assertElderlyAccess(id);

      if (session.user.role !== Role.DOCTOR) {
        return Response.json({ error: "คุณไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 });
      }

      await prisma.doctorPatient.update({
        where: {
          doctorId_elderlyId: {
            doctorId: session.user.id,
            elderlyId: id,
          },
        },
        data: {
          status: DoctorCaseStatus.COMPLETED,
          completedAt: new Date(),
          closedNote: parsed.data.closedNote,
        },
      });

      const updated = await syncElderlyCaseStatus(id, CaseStatus.COMPLETED);

      if (updated.caseStatus === CaseStatus.COMPLETED) {
        await prisma.$transaction([
          prisma.chatMessage.deleteMany({
            where: {
              elderlyId: id,
            },
          }),
          prisma.elderlyProfile.update({
            where: {
              id,
            },
            data: {
              doctorRequestNote: null,
              doctorRequestedAt: null,
            },
          }),
        ]);
      }

      await writeAuditLog({
        userId: session.user.id,
        action: "COMPLETE_DOCTOR_CASE",
        entityType: "ElderlyProfile",
        entityId: id,
        meta: {
          closedNote: parsed.data.closedNote,
          chatReset: updated.caseStatus === CaseStatus.COMPLETED,
        },
      });

      return Response.json(updated);
    }

    if (session.user.role !== Role.ADMIN) {
      return Response.json({ error: "คุณไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 });
    }

    await assertElderlyAccess(id);

    if (!parsed.data.doctorId) {
      return Response.json({ error: "กรุณาระบุ doctorId" }, { status: 400 });
    }

    const doctor = await prisma.user.findUnique({
      where: {
        id: parsed.data.doctorId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!doctor || doctor.role !== Role.DOCTOR) {
      return Response.json({ error: "ไม่พบคุณหมอที่เลือก" }, { status: 404 });
    }

    if (action === "ASSIGN_DOCTOR") {
      await prisma.doctorPatient.upsert({
        where: {
          doctorId_elderlyId: {
            doctorId: doctor.id,
            elderlyId: id,
          },
        },
        update: {
          status: DoctorCaseStatus.ACTIVE,
          completedAt: null,
          closedNote: null,
        },
        create: {
          doctorId: doctor.id,
          elderlyId: id,
          status: DoctorCaseStatus.ACTIVE,
        },
      });

      const updated = await syncElderlyCaseStatus(id, CaseStatus.IN_REVIEW);

      await prisma.elderlyProfile.update({
        where: { id },
        data: {
          doctorRequestNote: null,
        },
      });

      await writeAuditLog({
        userId: session.user.id,
        action: "ASSIGN_DOCTOR_CASE",
        entityType: "ElderlyProfile",
        entityId: id,
        meta: {
          doctorId: doctor.id,
        },
      });

      return Response.json(updated);
    }

    if (action === "REMOVE_DOCTOR") {
      await prisma.doctorPatient.upsert({
        where: {
          doctorId_elderlyId: {
            doctorId: doctor.id,
            elderlyId: id,
          },
        },
        update: {
          status: DoctorCaseStatus.COMPLETED,
          completedAt: new Date(),
          closedNote: parsed.data.closedNote ?? "ยกเลิกการดูแลโดยแอดมิน",
        },
        create: {
          doctorId: doctor.id,
          elderlyId: id,
          status: DoctorCaseStatus.COMPLETED,
          completedAt: new Date(),
          closedNote: parsed.data.closedNote ?? "ยกเลิกการดูแลโดยแอดมิน",
        },
      });

      const updated = await syncElderlyCaseStatus(id, CaseStatus.WAITING_DOCTOR);

      await writeAuditLog({
        userId: session.user.id,
        action: "REMOVE_DOCTOR_CASE",
        entityType: "ElderlyProfile",
        entityId: id,
        meta: {
          doctorId: doctor.id,
          closedNote: parsed.data.closedNote,
        },
      });

      return Response.json(updated);
    }

    return Response.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถอัปเดตสถานะเคสได้" },
      { status: 500 },
    );
  }
}
