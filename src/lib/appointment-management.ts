import { prisma } from "@/lib/prisma";
import { AppointmentStatus, RescheduleReason } from "@/generated/prisma";
import { addDays, startOfDay } from "date-fns";

export interface CreateAppointmentInput {
  elderlyId: string;
  doctorId: string;
  appointmentDate: Date;
  notes?: string;
}

export interface RescheduleAppointmentInput {
  appointmentId: string;
  newDate: Date;
  reason: RescheduleReason;
  reasonDetail?: string;
  rescheduledBy: string;
}

// Create appointment
export async function createAppointment(input: CreateAppointmentInput) {
  const appointment = await prisma.appointment.create({
    data: {
      elderlyId: input.elderlyId,
      doctorId: input.doctorId,
      appointmentDate: input.appointmentDate,
      notes: input.notes,
      status: AppointmentStatus.SCHEDULED,
    },
    include: {
      elderly: true,
      doctor: true,
    },
  });

  return appointment;
}

// Get upcoming appointments for elderly
export async function getElderlyUpcomingAppointments(elderlyId: string) {
  const today = startOfDay(new Date());
  
  return prisma.appointment.findMany({
    where: {
      elderlyId,
      appointmentDate: {
        gte: today,
      },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
      },
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      rescheduleHistory: {
        orderBy: {
          rescheduledAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      appointmentDate: "asc",
    },
  });
}

// Get all appointments for doctor
export async function getDoctorAppointments(doctorId: string) {
  return prisma.appointment.findMany({
    where: {
      doctorId,
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
      rescheduleHistory: {
        orderBy: {
          rescheduledAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      appointmentDate: "asc",
    },
  });
}

// Get appointments that need SMS reminder (3 days before)
export async function getAppointmentsNeedingReminder() {
  const today = new Date();
  const reminderDate = addDays(today, 3);
  const reminderDateStart = startOfDay(reminderDate);
  const reminderDateEnd = new Date(reminderDateStart.getTime() + 24 * 60 * 60 * 1000);

  return prisma.appointment.findMany({
    where: {
      appointmentDate: {
        gte: reminderDateStart,
        lt: reminderDateEnd,
      },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
      },
      reminderSentAt: null,
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
      doctor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// Get appointments for today (to send final reminder)
export async function getAppointmentsForToday() {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  return prisma.appointment.findMany({
    where: {
      appointmentDate: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
      },
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
      doctor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// Update appointment reminder sent
export async function markAppointmentReminderSent(appointmentId: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      reminderSentAt: new Date(),
    },
  });
}

// Reschedule appointment
export async function rescheduleAppointment(input: RescheduleAppointmentInput) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Create reschedule record
  await prisma.appointmentReschedule.create({
    data: {
      appointmentId: input.appointmentId,
      originalDate: appointment.appointmentDate,
      newDate: input.newDate,
      reason: input.reason,
      reasonDetail: input.reasonDetail,
      rescheduledBy: input.rescheduledBy,
    },
  });

  // Update appointment
  const updated = await prisma.appointment.update({
    where: { id: input.appointmentId },
    data: {
      appointmentDate: input.newDate,
      status: AppointmentStatus.RESCHEDULED,
      reminderSentAt: null, // Reset reminder for new date
    },
    include: {
      elderly: true,
      doctor: true,
    },
  });

  return updated;
}

// Cancel appointment
export async function cancelAppointment(appointmentId: string, cancellationReason?: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CANCELLED,
      notes: cancellationReason ? `Cancelled: ${cancellationReason}` : undefined,
    },
    include: {
      elderly: true,
      doctor: true,
    },
  });
}

// Complete appointment
export async function completeAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Create history record
  await prisma.appointmentHistory.create({
    data: {
      appointmentId: appointment.id,
      elderlyId: appointment.elderlyId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      notes: appointment.notes,
      status: AppointmentStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  // Update appointment
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.COMPLETED,
      appointmentCompletedAt: new Date(),
    },
    include: {
      elderly: true,
      doctor: true,
    },
  });
}

// Get appointment history for elderly
export async function getElderlyAppointmentHistory(elderlyId: string) {
  return prisma.appointmentHistory.findMany({
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
}

// Get all appointments for admin
export async function getAllAppointments(filters?: {
  elderlyId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
}) {
  return prisma.appointment.findMany({
    where: {
      ...(filters?.elderlyId && { elderlyId: filters.elderlyId }),
      ...(filters?.doctorId && { doctorId: filters.doctorId }),
      ...(filters?.status && { status: filters.status }),
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
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      rescheduleHistory: true,
    },
    orderBy: {
      appointmentDate: "desc",
    },
  });
}

// Get appointment by ID
export async function getAppointmentById(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      elderly: true,
      doctor: true,
      rescheduleHistory: true,
    },
  });
}
