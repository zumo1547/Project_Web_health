import { Role } from "@/generated/prisma";
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
    imageId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, imageId } = await context.params;
    const session = await requireRole([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]);
    await assertElderlyAccess(id);

    const image = await prisma.medicineImage.findFirst({
      where: {
        id: imageId,
        elderlyId: id,
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (!image) {
      return Response.json({ error: "ไม่พบรูปยาที่ต้องการลบ" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.aiScan.deleteMany({
        where: {
          medicineImageId: image.id,
        },
      });

      await tx.medicineImage.delete({
        where: {
          id: image.id,
        },
      });
    });

    try {
      await removeStoredUpload(image.imageUrl);
    } catch (storageError) {
      console.error("DELETE_MEDICINE_IMAGE_FILE_ERROR", storageError);
    }

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE_MEDICINE_IMAGE",
      entityType: "MedicineImage",
      entityId: image.id,
      meta: {
        elderlyId: id,
        imageUrl: image.imageUrl,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error("DELETE_MEDICINE_IMAGE_ROUTE_ERROR", error);
    return Response.json(
      { error: "ลบรูปยาไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 500 },
    );
  }
}
