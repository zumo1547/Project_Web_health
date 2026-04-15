import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  getAllAppointments,
} from "@/lib/appointment-management";
import {
  sendAppointmentConfirmation,
  sendAppointmentPostponeNotification,
  sendAppointmentCancellationNotification,
} from "@/lib/appointment-sms";
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
} from "@/lib/validations";
import { Role } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = req.nextUrl.searchParams.get("action");

    if (action === "create") {
      return await handleCreateAppointment(req, session);
    } else if (action === "reschedule") {
      return await handleRescheduleAppointment(req, session);
    } else if (action === "cancel") {
      return await handleCancelAppointment(req, session);
    } else if (action === "complete") {
      return await handleCompleteAppointment(req, session);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Appointment API Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type");

    if (type === "upcoming") {
      // Get upcoming appointments for elderly
      const elderly = await prisma.elderlyProfile.findUnique({
        where: { elderlyUserId: session.user.id },
      });

      if (!elderly) {
        return NextResponse.json([]);
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          elderlyId: elderly.id,
          appointmentDate: {
            gte: new Date(),
          },
          status: {
            in: ["SCHEDULED", "RESCHEDULED"],
          },
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
          appointmentDate: "asc",
        },
      });

      return NextResponse.json(appointments);
    } else if (type === "doctor") {
      // Get all appointments for doctor
      if (session.user.role !== Role.DOCTOR) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: session.user.id,
        },
        include: {
          elderly: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: {
          appointmentDate: "asc",
        },
      });

      return NextResponse.json(appointments);
    } else if (type === "all") {
      // Get all appointments for admin
      if (session.user.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const appointments = await getAllAppointments();
      return NextResponse.json(appointments);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[Appointment GET Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCreateAppointment(req: NextRequest, session: any) {
  const session2 = await auth();
  if (session2?.user?.role !== Role.DOCTOR && session2?.user?.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const validated = createAppointmentSchema.parse(body);

  // Get elderly info
  const elderly = await prisma.elderlyProfile.findUnique({
    where: { id: validated.elderlyId },
    include: {
      elderlyUser: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!elderly) {
    return NextResponse.json({ error: "Elderly not found" }, { status: 404 });
  }

  // Get doctor info
  const doctor = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Create appointment
  const appointment = await createAppointment({
    elderlyId: validated.elderlyId,
    doctorId: session.user.id,
    appointmentDate: new Date(validated.appointmentDate),
    notes: validated.notes,
  });

  // Send SMS confirmation
  if (elderly.phone) {
    await sendAppointmentConfirmation(
      elderly.phone,
      elderly.firstName,
      doctor?.name || "คุณหมอ",
      new Date(validated.appointmentDate)
    );
  }

  // Add to chat
  if (validated.notes) {
    await prisma.chatMessage.create({
      data: {
        elderlyId: validated.elderlyId,
        senderId: session.user.id,
        senderRole: Role.DOCTOR,
        content: `📅 นัดหมายวันที่ ${new Date(validated.appointmentDate).toLocaleDateString("th-TH")}\n\n💬 ${validated.notes}`,
      },
    });
  }

  return NextResponse.json(appointment);
}

async function handleRescheduleAppointment(req: NextRequest, session: any) {
  const body = await req.json();
  const validated = rescheduleAppointmentSchema.parse(body);

  const appointment = await prisma.appointment.findUnique({
    where: { id: validated.appointmentId },
    include: {
      elderly: true,
      doctor: true,
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Check authorization
  if (
    session.user.role === Role.DOCTOR &&
    appointment.doctorId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role === Role.ELDERLY) {
    const elderly = await prisma.elderlyProfile.findUnique({
      where: { elderlyUserId: session.user.id },
    });
    if (!elderly || appointment.elderlyId !== elderly.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Reschedule appointment
  const updated = await rescheduleAppointment({
    appointmentId: validated.appointmentId,
    newDate: new Date(validated.newDate),
    reason: validated.reason,
    reasonDetail: validated.reasonDetail,
    rescheduledBy: session.user.id,
  });

  // Send SMS notification
  if (appointment.elderly.phone) {
    const reasonText = {
      DOCTOR_UNAVAILABLE: "หมอไม่ว่างในวันนั้น",
      DOCTOR_EMERGENCY: "มีเรื่องด่วน",
      ELDERLY_REQUEST: "ตามคำขอผู้สูงอายุ",
      ADMIN_REQUEST: "ตามคำขอของแอดมิน",
      OTHER: validated.reasonDetail || "มีการเปลี่ยนแปลง",
    }[validated.reason];

    await sendAppointmentPostponeNotification(
      appointment.elderly.phone,
      appointment.elderly.firstName,
      appointment.doctor.name,
      appointment.appointmentDate,
      new Date(validated.newDate),
      reasonText
    );
  }

  return NextResponse.json(updated);
}

async function handleCancelAppointment(req: NextRequest, session: any) {
  const body = await req.json();
  const validated = cancelAppointmentSchema.parse(body);

  const appointment = await prisma.appointment.findUnique({
    where: { id: validated.appointmentId },
    include: {
      elderly: true,
      doctor: true,
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Check authorization
  if (
    session.user.role === Role.DOCTOR &&
    appointment.doctorId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role === Role.ELDERLY) {
    const elderly = await prisma.elderlyProfile.findUnique({
      where: { elderlyUserId: session.user.id },
    });
    if (!elderly || appointment.elderlyId !== elderly.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Cancel appointment
  const cancelled = await cancelAppointment(
    validated.appointmentId,
    validated.cancellationReason
  );

  // Send SMS notification
  if (appointment.elderly.phone) {
    await sendAppointmentCancellationNotification(
      appointment.elderly.phone,
      appointment.elderly.firstName,
      appointment.doctor.name,
      appointment.appointmentDate,
      validated.cancellationReason
    );
  }

  return NextResponse.json(cancelled);
}

async function handleCompleteAppointment(req: NextRequest, session: any) {
  if (session.user.role !== Role.DOCTOR && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { appointmentId } = body;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (
    session.user.role === Role.DOCTOR &&
    appointment.doctorId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const completed = await completeAppointment(appointmentId);
  return NextResponse.json(completed);
}
