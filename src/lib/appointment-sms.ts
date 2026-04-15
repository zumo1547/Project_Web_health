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
 * Send SMS reminder for appointment
 * Can be integrated with Twilio, AWS SNS, or other SMS providers
 * For now, this is a placeholder that logs to console
 * 
 * TODO: Integrate with actual SMS provider (Twilio, AWS SNS, etc.)
 */
export async function sendSms(input: SendSmsInput): Promise<boolean> {
  try {
    // TODO: Implement actual SMS sending via Twilio or other provider
    // Example for Twilio:
    // const accountSid = process.env.TWILIO_ACCOUNT_SID;
    // const authToken = process.env.TWILIO_AUTH_TOKEN;
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: input.message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: input.phoneNumber,
    // });

    console.log(`[SMS] To: ${input.phoneNumber}\nMessage: ${input.message}`);
    
    // Log to audit
    if (typeof window === "undefined") {
      // Server-side only
      const { prisma } = await import("@/lib/prisma");
      await prisma.auditLog.create({
        data: {
          action: "APPOINTMENT_SMS_SENT",
          entityType: "Appointment",
          entityId: "sms",
          meta: {
            phone: input.phoneNumber,
            message: input.message,
          },
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
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
