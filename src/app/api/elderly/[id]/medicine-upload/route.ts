import { Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  assertElderlyAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { storeUpload } from "@/lib/storage";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyAccess(id);

    const images = await prisma.medicineImage.findMany({
      where: {
        elderlyId: id,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return Response.json(images);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถโหลดรูปยาได้" }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole([
      Role.ADMIN,
      Role.DOCTOR,
      Role.ELDERLY,
    ]);
    await assertElderlyAccess(id);

    const formData = await req.formData();
    const file = formData.get("file");
    const labelValue = String(formData.get("label") ?? "").trim();

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "กรุณาอัปโหลดรูปยา" }, { status: 400 });
    }

    const stored = await storeUpload(file, `elderly/${id}/medicine`);

    const created = await prisma.medicineImage.create({
      data: {
        elderlyId: id,
        imageUrl: stored.url,
        label: labelValue || undefined,
        uploadedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPLOAD_MEDICINE_IMAGE",
      entityType: "MedicineImage",
      entityId: created.id,
      meta: {
        elderlyId: id,
        imageUrl: created.imageUrl,
        storageDriver: stored.driver,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถอัปโหลดรูปยาได้" }, { status: 500 });
  }
}
