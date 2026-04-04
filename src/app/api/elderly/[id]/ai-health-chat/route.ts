import { AiHealthMessageRole, DoctorCaseStatus, Role } from "@/generated/prisma";
import { generateAiHealthReply } from "@/lib/ai";
import { writeAuditLog } from "@/lib/audit";
import {
  assertElderlyAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { aiHealthChatSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyAccess(id);

    const messages = await prisma.aiHealthMessage.findMany({
      where: {
        elderlyId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return Response.json(messages);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถโหลดแชท AI ได้" }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]);
    await assertElderlyAccess(id);

    const body = await req.json();
    const parsed = aiHealthChatSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const elderly = await prisma.elderlyProfile.findUnique({
      where: {
        id,
      },
      include: {
        bloodPressures: {
          orderBy: {
            measuredAt: "desc",
          },
          take: 1,
        },
        medicineImages: {
          orderBy: {
            uploadedAt: "desc",
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
          where: {
            status: DoctorCaseStatus.ACTIVE,
          },
          select: {
            doctor: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!elderly) {
      return Response.json({ error: "ไม่พบเคสผู้สูงอายุ" }, { status: 404 });
    }

    const assistantReply = await generateAiHealthReply(parsed.data.content, {
      firstName: elderly.firstName,
      chronicDiseases: elderly.chronicDiseases,
      allergies: elderly.allergies,
      latestBloodPressure: elderly.bloodPressures[0]
        ? {
            systolic: elderly.bloodPressures[0].systolic,
            diastolic: elderly.bloodPressures[0].diastolic,
            pulse: elderly.bloodPressures[0].pulse,
            measuredAt: elderly.bloodPressures[0].measuredAt,
          }
        : null,
      latestMedicineLabel: elderly.medicineImages[0]?.label,
      latestAiSummary: elderly.aiScans[0]?.summary,
      doctorNames: elderly.doctors.map((item) => item.doctor.name),
      caseStatus: elderly.caseStatus,
    });

    const [userMessage, aiMessage] = await prisma.$transaction([
      prisma.aiHealthMessage.create({
        data: {
          elderlyId: id,
          role: AiHealthMessageRole.USER,
          content: parsed.data.content,
        },
      }),
      prisma.aiHealthMessage.create({
        data: {
          elderlyId: id,
          role: assistantReply.role,
          content: assistantReply.content,
        },
      }),
    ]);

    await writeAuditLog({
      userId: session.user.id,
      action: "AI_HEALTH_CHAT",
      entityType: "ElderlyProfile",
      entityId: id,
      meta: {
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id,
      },
    });

    return Response.json({
      userMessage,
      aiMessage,
    });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถคุยกับ AI ได้" }, { status: 500 });
  }
}
