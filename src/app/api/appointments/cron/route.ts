import { NextRequest, NextResponse } from "next/server";
import {
  getAppointmentsNeedingReminder,
  getAppointmentsForToday,
  markAppointmentReminderSent,
} from "@/lib/appointment-management";
import {
  sendAppointmentReminder,
  sendAppointmentConfirmation,
} from "@/lib/appointment-sms";
import { prisma } from "@/lib/prisma";

/**
 * Cron job to send appointment reminders
 * Should be called by a cron service like Vercel Cron or similar
 * 
 * Usage in Vercel: POST /api/appointments/cron to trigger
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret if set
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type") || "all";

    if (type === "reminder" || type === "all") {
      await sendReminderNotifications();
    }

    if (type === "today" || type === "all") {
      await sendTodayNotifications();
    }

    return NextResponse.json({ success: true, message: "Notifications sent" });
  } catch (error) {
    console.error("[Appointment Cron Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Send appointment reminders 3 days before
 */
async function sendReminderNotifications() {
  const appointments = await getAppointmentsNeedingReminder();

  for (const appointment of appointments) {
    try {
      if (!appointment.elderly.phone) {
        console.log(`[Skip SMS] No phone for elderly: ${appointment.elderly.id}`);
        continue;
      }

      const sent = await sendAppointmentReminder({
        phoneNumber: appointment.elderly.phone,
        patientName: appointment.elderly.firstName,
        doctorName: appointment.doctor.name,
        appointmentDate: appointment.appointmentDate,
        type: "3_days_before",
      });

      if (sent) {
        await markAppointmentReminderSent(appointment.id);
        console.log(`[SMS Sent] 3-day reminder for appointment: ${appointment.id}`);
      }
    } catch (error) {
      console.error(`[SMS Error] Failed to send reminder for ${appointment.id}:`, error);
    }
  }
}

/**
 * Send same-day appointment notifications
 */
async function sendTodayNotifications() {
  const appointments = await getAppointmentsForToday();

  for (const appointment of appointments) {
    try {
      if (!appointment.elderly.phone) {
        console.log(`[Skip SMS] No phone for elderly: ${appointment.elderly.id}`);
        continue;
      }

      const sent = await sendAppointmentReminder({
        phoneNumber: appointment.elderly.phone,
        patientName: appointment.elderly.firstName,
        doctorName: appointment.doctor.name,
        appointmentDate: appointment.appointmentDate,
        type: "on_day",
      });

      if (sent) {
        console.log(`[SMS Sent] Same-day reminder for appointment: ${appointment.id}`);
      }
    } catch (error) {
      console.error(`[SMS Error] Failed to send today reminder for ${appointment.id}:`, error);
    }
  }
}

/**
 * Manual endpoint to trigger a specific appointment cron
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (type === "reminder") {
    await sendReminderNotifications();
    return NextResponse.json({ success: true, message: "3-day reminders sent" });
  }

  if (type === "today") {
    await sendTodayNotifications();
    return NextResponse.json({ success: true, message: "Same-day reminders sent" });
  }

  return NextResponse.json({
    message: "Appointment cron endpoint",
    usage: "?type=reminder or ?type=today",
  });
}
