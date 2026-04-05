import {
  AiScanType,
  Gender,
  Role,
} from "@/generated/prisma";
import { z } from "zod";

export const loginPortalSchema = z
  .enum(["USER", "DOCTOR", "ADMIN"])
  .default("USER");

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  portal: loginPortalSchema,
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร"),
  email: z.string().trim().email(),
  password: z.string().min(8, "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร"),
  role: z.enum([Role.ADMIN, Role.DOCTOR, Role.ELDERLY]).default(Role.ELDERLY),
});

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
    .preprocess(
      (value) => (value === null ? undefined : value),
      z.string().optional(),
    )
    .transform((value) => value === "true"),
});

export const medicineUploadSchema = z.object({
  label: optionalString,
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

export const chatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "กรุณาพิมพ์ข้อความก่อนส่ง")
    .max(1000, "ข้อความยาวเกินไป"),
});

export const aiHealthChatSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "กรุณาพิมพ์คำถามก่อนส่ง")
    .max(1000, "ข้อความยาวเกินไป"),
});

export const caseRequestSchema = z.object({
  requestNote: optionalString,
});

export const doctorCaseActionSchema = z.object({
  action: z.enum([
    "REQUEST_DOCTOR",
    "JOIN_SELF",
    "COMPLETE_SELF",
    "ASSIGN_DOCTOR",
    "REMOVE_DOCTOR",
    "SET_SELF_SERVICE",
  ]),
  doctorId: optionalString,
  requestNote: optionalString,
  closedNote: optionalString,
});
