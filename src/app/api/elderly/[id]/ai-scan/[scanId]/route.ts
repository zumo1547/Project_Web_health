import { AiScanType, Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  assertElderlyAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { removeStoredUpload } from "@/lib/storage";

type RouteContext = {
  params: Promise<{
    id: string;
    scanId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, scanId } = await context.params;
    const session = await requireRole([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]);
    await assertElderlyAccess(id);

    const scan = await prisma.aiScan.findFirst({
      where: {
        id: scanId,
        elderlyId: id,
      },
      select: {
        id: true,
        elderlyId: true,
        medicineImageId: true,
        imageUrl: true,
        scanType: true,
      },
    });

    if (!scan) {
      return Response.json({ error: "ไม่พบผลสแกนที่ต้องการลบ" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const remainingLinkedScans = scan.medicineImageId
        ? await tx.aiScan.count({
            where: {
              medicineImageId: scan.medicineImageId,
              NOT: {
                id: scan.id,
              },
            },
          })
        : 0;

      await tx.aiScan.delete({
        where: {
          id: scan.id,
        },
      });

      if (scan.scanType === AiScanType.BLOOD_PRESSURE_IMAGE) {
        await tx.bloodPressureRecord.deleteMany({
          where: {
            elderlyId: id,
            sourceImageUrl: scan.imageUrl,
          },
        });
      }

      if (scan.medicineImageId && remainingLinkedScans === 0) {
        await tx.medicineImage.delete({
          where: {
            id: scan.medicineImageId,
          },
        });
      }
    });

    try {
      await removeStoredUpload(scan.imageUrl);
    } catch (storageError) {
      console.error("DELETE_AI_SCAN_FILE_ERROR", storageError);
    }

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE_AI_SCAN",
      entityType: "AiScan",
      entityId: scan.id,
      meta: {
        elderlyId: id,
        scanType: scan.scanType,
        imageUrl: scan.imageUrl,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error("DELETE_AI_SCAN_ROUTE_ERROR", error);
    return Response.json(
      { error: "ลบผลสแกนไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 500 },
    );
  }
}
