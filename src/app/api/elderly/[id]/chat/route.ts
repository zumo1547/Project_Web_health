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

    const shouldQueueDoctor =
      session.user.role === Role.ELDERLY &&
      (await prisma.doctorPatient.count({
        where: {
          elderlyId: id,
          status: DoctorCaseStatus.ACTIVE,
        },
      })) === 0;

    const preview = toChatPreview(parsed.data.content);

    const created = await prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
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

      if (shouldQueueDoctor) {
        await tx.elderlyProfile.update({
          where: {
            id,
          },
          data: {
            caseStatus: CaseStatus.WAITING_DOCTOR,
            doctorRequestedAt: new Date(),
            doctorRequestNote: preview,
          },
        });
      }

      return message;
    });

    await writeAuditLog({
      userId: session.user.id,
      action: shouldQueueDoctor ? "SEND_CHAT_AND_QUEUE_CASE" : "SEND_CHAT_MESSAGE",
      entityType: "ChatMessage",
      entityId: created.id,
      meta: {
        elderlyId: id,
        senderRole: session.user.role,
        queuedForDoctor: shouldQueueDoctor,
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
