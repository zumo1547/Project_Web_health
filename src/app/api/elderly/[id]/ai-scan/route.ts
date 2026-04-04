import { AiScanStatus, AiScanType, Prisma, Role } from "@/generated/prisma";
import { analyzeImage } from "@/lib/ai";
import { writeAuditLog } from "@/lib/audit";
import {
  assertElderlyAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { storeUpload } from "@/lib/storage";
import { aiScanFormSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function extractBloodPressureValues(rawResult: Record<string, unknown>) {
  const systolic =
    typeof rawResult.systolic === "number" ? rawResult.systolic : undefined;
  const diastolic =
    typeof rawResult.diastolic === "number" ? rawResult.diastolic : undefined;
  const pulse = typeof rawResult.pulse === "number" ? rawResult.pulse : undefined;

  if (!systolic || !diastolic) {
    return null;
  }

  return { systolic, diastolic, pulse };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyAccess(id);

    const scans = await prisma.aiScan.findMany({
      where: {
        elderlyId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(scans);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error("AI_SCAN_GET_ERROR", error);
    return Response.json(
      { error: "ไม่สามารถโหลดผลสแกน AI ได้" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]);
    await assertElderlyAccess(id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return Response.json(
        { error: "กรุณาอัปโหลดรูปสำหรับสแกน" },
        { status: 400 },
      );
    }

    const parsed = aiScanFormSchema.safeParse({
      scanType: formData.get("scanType") ?? undefined,
      hintText: formData.get("hintText") ?? undefined,
      autoCreateRecord: formData.get("autoCreateRecord") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const folder =
      parsed.data.scanType === AiScanType.MEDICINE_IMAGE
        ? `elderly/${id}/medicine-ai`
        : `elderly/${id}/blood-pressure-ai`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeUpload(file, folder);
    const result = await analyzeImage({
      scanType: parsed.data.scanType,
      fileName: file.name,
      imageUrl: stored.url,
      hintText: parsed.data.hintText,
      imageBuffer: fileBuffer,
    });

    const responsePayload = await prisma.$transaction(async (tx) => {
      let medicineImageId: string | undefined;

      if (parsed.data.scanType === AiScanType.MEDICINE_IMAGE) {
        const medicineImage = await tx.medicineImage.create({
          data: {
            elderlyId: id,
            imageUrl: stored.url,
            label: parsed.data.hintText,
            uploadedById: session.user.id,
          },
        });

        medicineImageId = medicineImage.id;
      }

      const aiScan = await tx.aiScan.create({
        data: {
          elderlyId: id,
          medicineImageId,
          scanType: parsed.data.scanType,
          imageUrl: stored.url,
          extractedText: result.extractedText,
          status: AiScanStatus.COMPLETED,
          rawResult: result.rawResult as Prisma.InputJsonValue,
          summary: result.summary,
          confidence: result.confidence,
        },
      });

      let bloodPressureRecord = null;
      const extracted = extractBloodPressureValues(result.rawResult);

      if (
        parsed.data.autoCreateRecord &&
        parsed.data.scanType === AiScanType.BLOOD_PRESSURE_IMAGE &&
        extracted
      ) {
        bloodPressureRecord = await tx.bloodPressureRecord.create({
          data: {
            elderlyId: id,
            systolic: extracted.systolic,
            diastolic: extracted.diastolic,
            pulse: extracted.pulse,
            measuredAt: new Date(),
            sourceImageUrl: stored.url,
            note: "สร้างอัตโนมัติจากการสแกน AI",
            createdById: session.user.id,
          },
        });
      }

      return {
        aiScan,
        bloodPressureRecord,
      };
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "RUN_AI_SCAN",
      entityType: "AiScan",
      entityId: responsePayload.aiScan.id,
      meta: {
        elderlyId: id,
        scanType: responsePayload.aiScan.scanType,
        imageUrl: responsePayload.aiScan.imageUrl,
        storageDriver: stored.driver,
      },
    });

    return Response.json(responsePayload, { status: 201 });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error("AI_SCAN_ROUTE_ERROR", error);
    return Response.json(
      { error: "ไม่สามารถสแกนรูปด้วย AI ได้" },
      { status: 500 },
    );
  }
}
