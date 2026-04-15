import { AiScanType, Gender, Role, RescheduleReason } from "@/generated/prisma";
import { z } from "zod";

export const loginPortalSchema = z.enum(["USER", "DOCTOR", "ADMIN"]).default("USER");

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const loginSchema = z.object({
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "กรุณากรอกรหัสผ่านอย่างน้อย 8 ตัวอักษร"),
  portal: loginPortalSchema,
});

const securePasswordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร")
  .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
  .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
  .regex(/\d/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว")
  .regex(/[^A-Za-z0-9]/, "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");

const elderlySelfRegisterSchema = z.object({
  titlePrefix: z.string().trim().min(1, "กรุณาเลือกคำนำหน้า"),
  firstName: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร"),
  lastName: z.string().trim().min(2, "กรุณากรอกนามสกุลอย่างน้อย 2 ตัวอักษร"),
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{8,9}$/, "กรุณากรอกเบอร์มือถือให้ถูกต้อง"),
  gender: z.nativeEnum(Gender, {
    message: "กรุณาเลือกเพศ",
  }),
  birthDate: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกวันเกิด")
    .refine((value) => !Number.isNaN(Date.parse(value)), "วันเกิดไม่ถูกต้อง"),
  password: securePasswordSchema,
  role: z.enum([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]).default(Role.ELDERLY),
});

const managedRegisterSchema = z.object({
  name: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร"),
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: securePasswordSchema,
  role: z.enum([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]).default(Role.ELDERLY),
});

export const registerSchema = z.union([elderlySelfRegisterSchema, managedRegisterSchema]);

export const elderlySchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  nationalId: optionalString,
  birthDate: optionalString,
  gender: z.nativeEnum(Gender).optional(),
  phone: optionalString,
  address: optionalString,
  allergies: optionalString,
  chronicDiseases: optionalString,
  notes: optionalString,
  doctorEmail: optionalString,
  elderlyEmail: optionalString,
});

export const elderlyUpdateSchema = elderlySchema
  .omit({
    doctorEmail: true,
    elderlyEmail: true,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 รายการ",
  });

// Appointment schemas
export const createAppointmentSchema = z.object({
  elderlyId: z.string().min(1, "กรุณาเลือกผู้สูงอายุ"),
  appointmentDate: z.string().min(1, "กรุณาเลือกวันนัด").refine((value) => {
    const date = new Date(value);
    return date > new Date();
  }, "วันนัดต้องเป็นวันในอนาคต"),
  notes: optionalString,
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "ไม่พบการนัดหมาย"),
  newDate: z.string().min(1, "กรุณาเลือกวันนัดใหม่").refine((value) => {
    const date = new Date(value);
    return date > new Date();
  }, "วันนัดต้องเป็นวันในอนาคต"),
  reason: z.nativeEnum(RescheduleReason, {
    message: "กรุณาเลือกเหตุผลการเลื่อนวัน",
  }),
  reasonDetail: optionalString,
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "ไม่พบการนัดหมาย"),
  cancellationReason: optionalString,
});

export const bloodPressureSchema = z.object({
  systolic: z.coerce.number().int().min(60).max(260),
  diastolic: z.coerce.number().int().min(40).max(160),
  pulse: z
    .union([z.coerce.number().int().min(30).max(220), z.nan()])
    .optional()
    .transform((value) =>
      typeof value === "number" && Number.isFinite(value) ? value : undefined,
    ),
  measuredAt: z.string().min(1),
  note: optionalString,
  sourceImageUrl: optionalString,
});

export const aiScanFormSchema = z.object({
  scanType: z.nativeEnum(AiScanType),
  hintText: optionalString,
  autoCreateRecord: z
    .preprocess((value) => (value === null ? undefined : value), z.string().optional())
    .transform((value) => value === "true"),
});

export const medicineUploadSchema = z.object({
  label: optionalString,
});

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, "กรุณาพิมพ์ข้อความ").max(4000, "ข้อความยาวเกินไป"),
});

export const aiHealthChatSchema = z.object({
  content: z.string().trim().min(1, "กรุณาพิมพ์คำถาม").max(4000, "ข้อความยาวเกินไป"),
});

export const doctorCaseActionSchema = z.object({
  action: z.enum([
    "REQUEST_DOCTOR",
    "SET_SELF_SERVICE",
    "JOIN_SELF",
    "COMPLETE_SELF",
    "ASSIGN_DOCTOR",
    "REMOVE_DOCTOR",
  ]),
  requestNote: optionalString,
  closedNote: optionalString,
  doctorId: optionalString,
});

export const nearbyHospitalLookupSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: optionalString,
  persist: z.boolean().optional().default(true),
  radiusKm: z.number().min(1).max(20).optional().default(8),
});

export const adminUserRoleSchema = z.object({
  role: z.enum([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]),
});
