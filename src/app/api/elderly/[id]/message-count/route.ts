import { DoctorCaseStatus, Role } from "@/generated/prisma";
import {
  assertElderlyReadAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/elderly/[id]/message-count
 * ดึงจำนวนข้อความใหม่ (ข้อความที่ส่งมาหลังจากที่หมอรับเคส)
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole([Role.DOCTOR, Role.ADMIN]);
    await assertElderlyReadAccess(id);

    // ตรวจสอบว่าหมอรับเคสนี้อยู่หรือไม่
    const whereCondition: any = {
      elderlyId: id,
      status: DoctorCaseStatus.ACTIVE,
    };

    // ถ้าเป็น DOCTOR ต้องตรวจสอบว่า doctor นี้เท่านั้น
    if (session.user.role === Role.DOCTOR) {
      whereCondition.doctorId = session.user.id;
    }

    const doctorCase = await prisma.doctorPatient.findFirst({
      where: whereCondition,
      select: {
        createdAt: true,
      },
    });

    if (!doctorCase) {
      return Response.json({ unreadCount: 0, totalCount: 0 });
    }

    // นับข้อความทั้งหมด
    const totalCount = await prisma.chatMessage.count({
      where: {
        elderlyId: id,
      },
    });

    // นับข้อความใหม่ (ข้อความที่ส่งมาหลังจากหมอรับเคส)
    const unreadCount = await prisma.chatMessage.count({
      where: {
        elderlyId: id,
        createdAt: {
          gte: doctorCase.createdAt,
        },
      },
    });

    return Response.json({
      totalCount,
      unreadCount,
      caseStartedAt: doctorCase.createdAt,
    });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถนับข้อความได้", unreadCount: 0, totalCount: 0 },
      { status: 500 },
    );
  }
}
