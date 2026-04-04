import { Role } from "@/generated/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  assertElderlyAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { bloodPressureSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyAccess(id);

    const records = await prisma.bloodPressureRecord.findMany({
      where: {
        elderlyId: id,
      },
      orderBy: {
        measuredAt: "desc",
      },
    });

    return Response.json(records);
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถโหลดประวัติความดันได้" }, { status: 500 });
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

    const body = await req.json();
    const parsed = bloodPressureSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const created = await prisma.bloodPressureRecord.create({
      data: {
        elderlyId: id,
        systolic: parsed.data.systolic,
        diastolic: parsed.data.diastolic,
        pulse: parsed.data.pulse,
        measuredAt: new Date(parsed.data.measuredAt),
        sourceImageUrl: parsed.data.sourceImageUrl,
        note: parsed.data.note,
        createdById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE_BLOOD_PRESSURE_RECORD",
      entityType: "BloodPressureRecord",
      entityId: created.id,
      meta: {
        elderlyId: id,
        systolic: created.systolic,
        diastolic: created.diastolic,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json({ error: "ไม่สามารถบันทึกค่าความดันได้" }, { status: 500 });
  }
}
