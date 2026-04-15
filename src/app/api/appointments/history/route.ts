import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const elderlyId = req.nextUrl.searchParams.get("elderlyId");

    if (!elderlyId) {
      return NextResponse.json({ error: "Missing elderlyId" }, { status: 400 });
    }

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
      session.user.role !== "ADMIN"
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
