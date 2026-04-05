import { Role } from "@/generated/prisma";
import {
  buildHospitalSearchUrl,
  fetchNearbyHospitals,
  formatLocationLabel,
} from "@/lib/hospital-map";
import {
  assertElderlyAccess,
  assertElderlyReadAccess,
  permissionErrorToResponse,
  requireRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { nearbyHospitalLookupSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseRadiusKm(request: Request) {
  const { searchParams } = new URL(request.url);
  const radiusValue = Number(searchParams.get("radiusKm") ?? "8");

  if (!Number.isFinite(radiusValue)) {
    return 8;
  }

  return Math.min(Math.max(radiusValue, 1), 20);
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await assertElderlyReadAccess(id);

    const elderly = await prisma.elderlyProfile.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        lastKnownLatitude: true,
        lastKnownLongitude: true,
        lastKnownLocationLabel: true,
        lastKnownLocationUpdatedAt: true,
      },
    });

    if (!elderly) {
      return Response.json({ error: "ไม่พบแฟ้มผู้สูงอายุ" }, { status: 404 });
    }

    if (
      elderly.lastKnownLatitude === null ||
      elderly.lastKnownLongitude === null
    ) {
      return Response.json(
        {
          error:
            "ยังไม่มีตำแหน่งล่าสุดของผู้สูงอายุ กรุณาให้ผู้สูงอายุกดดูโรงพยาบาลใกล้ฉันอย่างน้อย 1 ครั้งก่อน",
        },
        { status: 404 },
      );
    }

    const radiusKm = parseRadiusKm(request);
    const locationLabel = formatLocationLabel(
      elderly.lastKnownLocationLabel,
      elderly.lastKnownLatitude,
      elderly.lastKnownLongitude,
    );

    try {
      const hospitals = await fetchNearbyHospitals(
        elderly.lastKnownLatitude,
        elderly.lastKnownLongitude,
        radiusKm,
      );

      return Response.json({
        patientName: `${elderly.firstName} ${elderly.lastName}`.trim(),
        location: {
          latitude: elderly.lastKnownLatitude,
          longitude: elderly.lastKnownLongitude,
          label: locationLabel,
          updatedAt: elderly.lastKnownLocationUpdatedAt?.toISOString() ?? null,
          source: "saved" as const,
        },
        hospitals,
        mapSearchUrl: buildHospitalSearchUrl(
          elderly.lastKnownLatitude,
          elderly.lastKnownLongitude,
        ),
      });
    } catch (error) {
      console.error("NEARBY_HOSPITALS_FETCH_ERROR", error);

      return Response.json({
        patientName: `${elderly.firstName} ${elderly.lastName}`.trim(),
        location: {
          latitude: elderly.lastKnownLatitude,
          longitude: elderly.lastKnownLongitude,
          label: locationLabel,
          updatedAt: elderly.lastKnownLocationUpdatedAt?.toISOString() ?? null,
          source: "saved" as const,
        },
        hospitals: [],
        mapSearchUrl: buildHospitalSearchUrl(
          elderly.lastKnownLatitude,
          elderly.lastKnownLongitude,
        ),
        warning:
          "โหลดรายชื่อโรงพยาบาลอัตโนมัติไม่สำเร็จ แต่ยังสามารถเปิดแผนที่ใกล้ฉันได้",
      });
    }
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถโหลดโรงพยาบาลใกล้ฉันได้" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await requireRole([Role.ADMIN, Role.ELDERLY]);
    await assertElderlyAccess(id);

    const body = await request.json();
    const parsed = nearbyHospitalLookupSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessage =
        parsed.error.flatten().fieldErrors.latitude?.[0] ??
        parsed.error.flatten().fieldErrors.longitude?.[0] ??
        parsed.error.flatten().fieldErrors.radiusKm?.[0] ??
        "ไม่สามารถอ่านตำแหน่งปัจจุบันได้";

      return Response.json({ error: errorMessage }, { status: 400 });
    }

    const { latitude, longitude, label, persist, radiusKm } = parsed.data;

    const elderly = await prisma.elderlyProfile.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    if (!elderly) {
      return Response.json({ error: "ไม่พบแฟ้มผู้สูงอายุ" }, { status: 404 });
    }

    const updatedAt = persist ? new Date() : null;

    if (persist) {
      await prisma.elderlyProfile.update({
        where: { id },
        data: {
          lastKnownLatitude: latitude,
          lastKnownLongitude: longitude,
          lastKnownLocationLabel: label ?? null,
          lastKnownLocationUpdatedAt: updatedAt,
        },
      });
    }

    const locationLabel = formatLocationLabel(label, latitude, longitude);
    const responseBase = {
      patientName: `${elderly.firstName} ${elderly.lastName}`.trim(),
      location: {
        latitude,
        longitude,
        label: locationLabel,
        updatedAt: updatedAt?.toISOString() ?? null,
        source: "live" as const,
      },
      mapSearchUrl: buildHospitalSearchUrl(latitude, longitude),
      canShareToDoctor: session.user.role === Role.ELDERLY,
    };

    try {
      const hospitals = await fetchNearbyHospitals(latitude, longitude, radiusKm);

      return Response.json({
        ...responseBase,
        hospitals,
      });
    } catch (fetchError) {
      console.error("NEARBY_HOSPITALS_POST_FETCH_ERROR", fetchError);

      return Response.json({
        ...responseBase,
        hospitals: [],
        warning:
          "โหลดรายชื่อโรงพยาบาลอัตโนมัติไม่สำเร็จ แต่ยังสามารถเปิดแผนที่ค้นหาโรงพยาบาลใกล้ฉันได้",
      });
    }
  } catch (error) {
    const permissionResponse = permissionErrorToResponse(error);
    if (permissionResponse) return permissionResponse;

    console.error(error);
    return Response.json(
      { error: "ไม่สามารถค้นหาโรงพยาบาลใกล้ฉันได้" },
      { status: 500 },
    );
  }
}
