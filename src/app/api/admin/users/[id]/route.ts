import { Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import { permissionErrorToResponse, requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { adminUserRoleSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { id } = await context.params;
    const body = await req.json();
    const parsed = adminUserRoleSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors.role?.[0] ?? "บทบาทไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        elderlyProfile: {
          select: {
            id: true,
          },
        },
        doctorPatients: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    if (user.id === session.user.id && parsed.data.role !== Role.ADMIN) {
      return Response.json(
        { error: "ไม่สามารถลดสิทธิ์บัญชีแอดมินที่กำลังใช้อยู่ได้" },
        { status: 400 },
      );
    }

    if (parsed.data.role === Role.DOCTOR && user.elderlyProfile) {
      return Response.json(
        { error: "บัญชีนี้ผูกกับเคสผู้สูงอายุอยู่ จึงยังตั้งเป็นคุณหมอไม่ได้" },
        { status: 400 },
      );
    }

    if (parsed.data.role === Role.ELDERLY && user.doctorPatients.length > 0) {
      return Response.json(
        { error: "คุณหมอคนนี้ยังมีเคสที่รับไว้ จึงยังเปลี่ยนกลับไม่ได้" },
        { status: 400 },
      );
    }

    if (user.role === Role.ADMIN && parsed.data.role !== Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminCount <= 1) {
        return Response.json(
          { error: "ระบบต้องมีแอดมินอย่างน้อย 1 คน" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: parsed.data.role,
      },
      select: {
        id: true,
        role: true,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE_USER_ROLE",
      entityType: "User",
      entityId: updated.id,
      meta: {
        role: updated.role,
      },
    });

    return Response.json(updated);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถอัปเดตบทบาทได้" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { id } = await context.params;

    if (id === session.user.id) {
      return Response.json(
        { error: "ไม่สามารถลบบัญชีแอดมินที่กำลังใช้อยู่ได้" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return Response.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    if (user.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminCount <= 1) {
        return Response.json(
          { error: "ระบบต้องมีแอดมินอย่างน้อย 1 คน" },
          { status: 400 },
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE_USER",
      entityType: "User",
      entityId: id,
    });

    return Response.json({ success: true });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถลบผู้ใช้ได้" }, { status: 500 });
  }
}
