import { CaseStatus, DoctorCaseStatus, Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  assertElderlyAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const chatRoles = [Role.ADMIN, Role.DOCTOR, Role.ELDERLY];

function toChatPreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 117)}...`;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyAccess(id);

    const messages = await prisma.chatMessage.findMany({
      where: {
        elderlyId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return Response.json(messages);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถโหลดข้อความแชทได้" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole(chatRoles);
    await assertElderlyAccess(id);

    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error:
            parsed.error.flatten().fieldErrors.content?.[0] ??
            "ส่งข้อความไม่สำเร็จ",
        },
        { status: 400 },
      );
    }

    // ตรวจสอบว่ามีเคสหมอที่ active อยู่หรือไม่
    const activeDoctorCase = await prisma.doctorPatient.count({
      where: {
        elderlyId: id,
        status: DoctorCaseStatus.ACTIVE,
      },
    });

    // ผู้สูงอายุต้องมีหมอรับเคสแล้ว จึงจะได้ส่งข้อความ
    if (session.user.role === Role.ELDERLY && activeDoctorCase === 0) {
      return Response.json(
        { error: "กรุณาส่งคำขอให้คุณหมอรับเคสก่อน จึงจะสามารถแชทได้" },
        { status: 403 },
      );
    }

    // หมอต้องรับเคสนี้อยู่ จึงจะได้ส่งข้อความ
    if (session.user.role === Role.DOCTOR) {
      const isDoctorAssigned = await prisma.doctorPatient.findFirst({
        where: {
          elderlyId: id,
          doctorId: session.user.id,
          status: DoctorCaseStatus.ACTIVE,
        },
      });

      if (!isDoctorAssigned) {
        return Response.json(
          { error: "คุณยังไม่ได้รับเคสนี้ หรือเคสนี้ปิดไปแล้ว" },
          { status: 403 },
        );
      }
    }

    const preview = toChatPreview(parsed.data.content);

    const created = await prisma.chatMessage.create({
      data: {
        elderlyId: id,
        senderId: session.user.id,
        senderRole: session.user.role,
        content: parsed.data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "SEND_CHAT_MESSAGE",
      entityType: "ChatMessage",
      entityId: created.id,
      meta: {
        elderlyId: id,
        senderRole: session.user.role,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถส่งข้อความได้" },
      { status: 500 },
    );
  }
}
