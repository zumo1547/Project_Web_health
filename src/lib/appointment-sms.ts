import { formatDate, formatSystemDateTime } from "@/lib/date-time";

export interface SendSmsInput {
  phoneNumber: string;
  message: string;
}

export interface AppointmentReminderInput {
  phoneNumber: string;
  patientName: string;
  doctorName: string;
  appointmentDate: Date;
  type: "3_days_before" | "on_day";
}

/**
 * Format Thai phone number to international format
 * Converts: 0812345678 → +66812345678
 */
function formatThaiPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, ""); // Remove non-digits
  
  if (cleaned.startsWith("0")) {
    cleaned = "66" + cleaned.substring(1);
  } else if (!cleaned.startsWith("66")) {
    cleaned = "66" + cleaned;
  }
  
  return "+" + cleaned;
}

/**
 * Send SMS via Twilio
 * Production-ready implementation
 */
export async function sendSms(input: SendSmsInput): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // Check if SMS is enabled
    if (!accountSid || !authToken || !fromNumber) {
      console.warn("[SMS] Twilio credentials not configured - SMS disabled");
      
      // Log to audit even if SMS is disabled
      if (typeof window === "undefined") {
        const { prisma } = await import("@/lib/prisma");
        await prisma.auditLog.create({
          data: {
            action: "APPOINTMENT_SMS_DISABLED",
            entityType: "Appointment",
            entityId: "sms",
            meta: {
              phone: input.phoneNumber,
              message: input.message,
              reason: "Twilio credentials not configured",
            },
          },
        });
      }
      return false;
    }

    // Dynamic import of twilio to avoid build issues if not installed
    let twilio;
    try {
      twilio = require("twilio");
    } catch (e) {
      console.error("[SMS] Twilio library not installed");
      return false;
    }

    const client = twilio(accountSid, authToken);
    const formattedPhone = formatThaiPhoneNumber(input.phoneNumber);

    const response = await client.messages.create({
      body: input.message,
      from: fromNumber,
      to: formattedPhone,
    });

    console.log(`[SMS Sent] SID: ${response.sid}, To: ${formattedPhone}`);

    // Log successful SMS to audit
    if (typeof window === "undefined") {
      const { prisma } = await import("@/lib/prisma");
      await prisma.auditLog.create({
        data: {
          action: "APPOINTMENT_SMS_SENT",
          entityType: "Appointment",
          entityId: response.sid || "sms",
          meta: {
            phone: input.phoneNumber,
            formattedPhone: formattedPhone,
            message: input.message,
            twilioSid: response.sid,
            status: response.status,
          },
        },
      });
    }

    return response.status !== "failed";
  } catch (error) {
    console.error("[SMS Error]", error instanceof Error ? error.message : error);
    
    // Log error to audit
    if (typeof window === "undefined") {
      const { prisma } = await import("@/lib/prisma");
      await prisma.auditLog.create({
        data: {
          action: "APPOINTMENT_SMS_FAILED",
          entityType: "Appointment",
          entityId: "sms-error",
          meta: {
            phone: input.phoneNumber,
            message: input.message,
            error: error instanceof Error ? error.message : String(error),
          },
        },
      });
    }
    
    return false;
  }
}

/**
 * Send appointment reminder SMS
 */
export async function sendAppointmentReminder(
  input: AppointmentReminderInput
): Promise<boolean> {
  let message: string;

  if (input.type === "3_days_before") {
    message = `สวัสดีคุณ${input.patientName} 😊\n\nการนัดหมายของคุณกล่าวมา!\n\n📅 วันที่นัด: ${formatDate(input.appointmentDate)}\n👨‍⚕️ คุณหมอ: ${input.doctorName}\n\nพบกันเร็วๆ นี้ที่คลินิก\n\nหากต้องเลื่อนวัน โปรดแจ้งแอปหลัง 24 ชั่วโมงข้างหน้า`;
  } else {
    message = `สวัสดีคุณ${input.patientName} 👋\n\nวันนี้คือวันนัดหมายของคุณ!\n\n📅 เวลา: ${formatSystemDateTime(input.appointmentDate)}\n👨‍⚕️ คุณหมอ: ${input.doctorName}\n\nกรุณาเตรียมตัวให้พร้อม`;
  }

  return sendSms({
    phoneNumber: input.phoneNumber,
    message,
  });
}

/**
 * Send appointment confirmation SMS (when created)
 */
export async function sendAppointmentConfirmation(
  phoneNumber: string,
  patientName: string,
  doctorName: string,
  appointmentDate: Date
): Promise<boolean> {
  const message = `✅ นัดหมายของคุณได้รับการยืนยันแล้ว\n\n📅 วันที่นัด: ${formatDate(appointmentDate)}\n👨‍⚕️ คุณหมอ: ${doctorName}\n\nติดตามสถานะได้ที่แอปนะคะ`;

  return sendSms({
    phoneNumber,
    message,
  });
}

/**
 * Send appointment postponement notification
 */
export async function sendAppointmentPostponeNotification(
  phoneNumber: string,
  patientName: string,
  doctorName: string,
  oldDate: Date,
  newDate: Date,
  reason: string
): Promise<boolean> {
  const message = `📅 วันนัดหมายของคุณเลื่อนวันแล้ว\n\nเดิม: ${formatDate(oldDate)}\nใหม่: ${formatDate(newDate)}\n\nเหตุผล: ${reason}\n👨‍⚕️ คุณหมอ: ${doctorName}\n\nเข้าแอปเพื่อเห็นรายละเอียด`;

  return sendSms({
    phoneNumber,
    message,
  });
}

/**
 * Send appointment cancellation notification
 */
export async function sendAppointmentCancellationNotification(
  phoneNumber: string,
  patientName: string,
  doctorName: string,
  appointmentDate: Date,
  reason?: string
): Promise<boolean> {
  const reasonText = reason ? `\nเหตุผล: ${reason}` : "";
  const message = `❌ การนัดหมายของคุณถูกยกเลิก\n\n📅 วันที่นัด: ${formatDate(appointmentDate)}${reasonText}\n👨‍⚕️ คุณหมอ: ${doctorName}\n\nโปรดติดต่อแอปเพื่อจัดเวลาใหม่`;

  return sendSms({
    phoneNumber,
    message,
  });
}
