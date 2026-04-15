import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const elderlyId = req.nextUrl.searchParams.get("elderlyId");

    // If no elderlyId, return doctor's own appointment history
    if (!elderlyId) {
      if (session.user.role !== Role.DOCTOR && session.user.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const history = await prisma.appointmentHistory.findMany({
        where: {
          doctorId: session.user.id,
        },
        include: {
          elderly: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          appointmentDate: "desc",
        },
      });

      return NextResponse.json(history);
    }

    // If elderlyId is provided, return that elderly's history
    // Check authorization - user can only view their own history
    const elderly = await prisma.elderlyProfile.findUnique({
      where: { id: elderlyId },
      select: { elderlyUserId: true },
    });

    if (!elderly) {
      return NextResponse.json({ error: "Elderly not found" }, { status: 404 });
    }

    // Only the elderly user themselves or admin can view
    if (
      session.user.id !== elderly.elderlyUserId &&
      session.user.role !== Role.ADMIN
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const history = await prisma.appointmentHistory.findMany({
      where: {
        elderlyId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        appointmentDate: "desc",
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("[Appointment History Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
