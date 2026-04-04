import { Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import { permissionErrorToResponse, requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { id } = await context.params;

    const profile = await prisma.elderlyProfile.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!profile) {
      return Response.json({ error: "ไม่พบเคสผู้สูงอายุ" }, { status: 404 });
    }

    await prisma.elderlyProfile.delete({
      where: { id },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE_ELDERLY_PROFILE",
      entityType: "ElderlyProfile",
      entityId: id,
    });

    return Response.json({ success: true });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถลบเคสได้" }, { status: 500 });
  }
}
