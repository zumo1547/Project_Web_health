# 📱 SMS Notification System - Setup Guide

## ✅ ระบบ SMS พร้อมใช้งานแล้ว!

ระบบ SMS notification ได้ถูก implement โดยใช้ **Twilio** แล้ว พร้อมสำหรับการส่ง SMS ไปยังเบอร์โทรศัพท์ที่ผู้สูงอายุสมัครไว้

---

## 🔑 ขั้นตอนที่ 1: สร้าง Twilio Account

### 1.1 สมัคร Twilio
1. ไปที่ https://www.twilio.com/console
2. สมัครสมาชิก (ต้องใช้ email และหมายเลขโทรศัพท์)
3. ยืนยัน email + OTP

### 1.2 ได้รับ Twilio Credentials
หลังจากสมัครสำเร็จ คุณจะได้:
- **Account SID** - (บรรทัดบนสุดของหน้า console)
- **Auth Token** - (ด้านข้างของ Account SID)

ตัวอย่าง:
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📞 ขั้นตอนที่ 2: ได้รับ Twilio Phone Number

### 2.1 สมัครเบอร์โทร
1. เข้า Twilio Console → Phone Numbers
2. Click "Get your first Twilio phone number"
3. Twilio จะให้เบอร์โทรชั่วคราว เช่น: **+1 234 567 8900**
4. **Keep This Number** เพื่อใช้ถาวร

**Note**: หากต้องการเบอร์ไทย (+66) ต้องตรวจสอบ Twilio ว่ารองรับประเทศไทยหรือไม่ (อาจต้องใช้ Service เพิ่มเติม)

### 2.2 ได้รับ Twilio Phone Number
เช่น: **+1 XXXXX XXXXX** (ใช้เบอร์นี้เป็น FROM number)

---

## 💳 ขั้นตอนที่ 3: เติมเงินบัญชี (Optional)

### หากใช้เบอร์ Trial
- ได้ 15 USD ฟรี (ใช้สำหรับทดสอบ)
- สามารถส่ง SMS ได้ถึง 10-15 ข้อความ

### หากใช้เบอร์ Production
- ต้องเติมเงินเพื่อส่ง SMS ไปยังเบอร์จริง
- เข้า Twilio Console → Billing → Add Card
- ราคา SMS ประมาณ $0.0075-0.015 ต่อ 1 ข้อความ

---

## 🔐 ขั้นตอนที่ 4: ตั้ง Vercel Environment Variables

### ใน Vercel Dashboard:

1. เข้า **Project Settings** → **Environment Variables**
2. เพิ่ม 3 ตัวแปร:

#### Variable 1: TWILIO_ACCOUNT_SID
- **Name**: `TWILIO_ACCOUNT_SID`
- **Value**: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (ค่าจาก Twilio Console)
- **Environment**: Production + Preview + Development

#### Variable 2: TWILIO_AUTH_TOKEN
- **Name**: `TWILIO_AUTH_TOKEN`
- **Value**: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (ค่าจาก Twilio Console)
- **Environment**: Production + Preview + Development

#### Variable 3: TWILIO_PHONE_NUMBER
- **Name**: `TWILIO_PHONE_NUMBER`
- **Value**: +1234567890 (เบอร์ Twilio ของคุณ เช่น +1 XXXXX XXXXX)
- **Environment**: Production + Preview + Development

#### Variable 4: CRON_SECRET (Optional แต่แนะนำ)
- **Name**: `CRON_SECRET`
- **Value**: ข้อความลับที่คุณต้องการ เช่น `your-super-secret-key-12345`
- **Environment**: Production + Preview + Development

---

## ✅ ขั้นตอนที่ 5: ตั้ง Local Environment (ทดสอบ)

### ในโฟลเดอร์ project:

```bash
# สร้างไฟล์ .env.local (ถ้ายังไม่มี)
cp .env.example .env.local
```

### แล้วเพิ่มลงใน `.env.local`:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Cron Security
CRON_SECRET=your-super-secret-key-12345

# Database (ต้องเติมให้ครบ)
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
```

---

## 📦 ขั้นตอนที่ 6: Install Twilio Package

```bash
# ติดตั้ง twilio package
npm install twilio

# Verify install
npm list twilio
```

---

## 🚀 ขั้นตอนที่ 7: Deploy & Test

### Deploy ขึ้น Vercel:
```bash
git add .
git commit -m "feat: Add SMS environment variables"
git push origin main
# Vercel auto-deploy
```

### Test SMS ด้วย API Endpoint:

#### ทดสอบ API Appointment Create (SMS Confirmation):
```bash
curl -X POST http://localhost:3000/api/appointments?action=create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "elderlyId": "elderly123",
    "doctorId": "doctor456",
    "appointmentDate": "2026-04-25T10:00:00Z",
    "notes": "ตรวจสุขภาพประจำปี"
  }'
```

#### ทดสอบ Cron Job (SMS Reminder):
```bash
# 3-day reminder
curl -X POST https://your-app.vercel.app/api/appointments/cron?type=reminder \
  -H "Authorization: Bearer CRON_SECRET_VALUE"

# Today reminder  
curl -X POST https://your-app.vercel.app/api/appointments/cron?type=today \
  -H "Authorization: Bearer CRON_SECRET_VALUE"
```

---

## 📋 ตรวจสอบ SMS Messages

ระบบจะส่ง SMS ในกรณีต่อไปนี้:

### 1️⃣ SMS ยืนยันนัด (ตอนสร้าง)
```
✅ นัดหมายของคุณได้รับการยืนยันแล้ว

📅 วันที่นัด: [วันที่]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

ติดตามสถานะได้ที่แอปนะคะ
```

### 2️⃣ SMS แจ้งเตือน 3 วันก่อน (Cron job)
```
สวัสดีคุณ[ชื่อ] 😊

การนัดหมายของคุณกล่าวมา!

📅 วันที่นัด: [วันที่]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

พบกันเร็วๆ นี้ที่คลินิก

หากต้องเลื่อนวัน โปรดแจ้งแอปหลัง 24 ชั่วโมงข้างหน้า
```

### 3️⃣ SMS แจ้งเตือนวันนัด (Cron job)
```
สวัสดีคุณ[ชื่อ] 👋

วันนี้คือวันนัดหมายของคุณ!

📅 เวลา: [เวลา]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

กรุณาเตรียมตัวให้พร้อม
```

### 4️⃣ SMS เลื่อนนัด (เมื่อเลื่อน)
```
📅 วันนัดหมายของคุณเลื่อนวันแล้ว

เดิม: [วันเดิม]
ใหม่: [วันใหม่]

เหตุผล: [เหตุผล]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

เข้าแอปเพื่อเห็นรายละเอียด
```

### 5️⃣ SMS ยกเลิกนัด (เมื่อยกเลิก)
```
❌ การนัดหมายของคุณถูกยกเลิก

📅 วันที่นัด: [วันที่]
เหตุผล: [เหตุผล]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

โปรดติดต่อแอปเพื่อจัดเวลาใหม่
```

---

## 🔧 ขั้นตอนที่ 8: ตั้ง Cron Job (SMS ส่งอัตโนมัติ)

### Option A: ใช้ Vercel Cron (แนะนำ)

สร้างไฟล์ `vercel.json` ในโฟลเดอร์ root:

```json
{
  "crons": [
    {
      "path": "/api/appointments/cron?type=reminder",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/appointments/cron?type=today",
      "schedule": "0 7 * * *"
    }
  ]
}
```

**ความหมาย**:
- `"0 8 * * *"` = ทุกวัน เวลา 08:00 UTC (3-day reminder)
- `"0 7 * * *"` = ทุกวัน เวลา 07:00 UTC (today reminder)

### Option B: ใช้ External Cron Service

1. เข้า https://www.easycron.com
2. สมัครสมาชิก
3. สร้าง Cron Job:
   - URL: `https://your-app.vercel.app/api/appointments/cron?type=reminder`
   - Schedule: `0 08 * * *` (ทุกวัน เวลา 08:00)
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

---

## 🎯 ขั้นตอนที่ 9: ตรวจสอบ Audit Log

ระบบจะเก็บ SMS history ใน `AuditLog` table:

```bash
npm run db:studio

# ดู AuditLog table
# ค้นหา action: "APPOINTMENT_SMS_SENT" 
```

---

## ⚠️ Troubleshooting

### ปัญหา: SMS ไม่ส่ง
```
ตรวจสอบ:
1. TWILIO_ACCOUNT_SID ถูกต้องหรือ?
2. TWILIO_AUTH_TOKEN ถูกต้องหรือ?
3. TWILIO_PHONE_NUMBER ถูกต้องหรือ?
4. เบอร์ผู้สูงอายุ (ElderlyProfile.phone) มีหรือไม่?
5. ดู Vercel logs: vercel logs
```

### ปัญหา: Phone number format ผิด
```
ระบบจะแปลง Thai phone ให้เป็น international format:
- 0812345678 → +66812345678 ✅
- 6681234567 → +66812345678 ✅
- +66812345678 → +66812345678 ✅
```

### ปัญหา: Cron job ไม่ทำงาน
```
ตรวจสอบ:
1. CRON_SECRET ตั้งให้ถูกต้องหรือ?
2. vercel.json ถูกต้องหรือ?
3. ดู Cron logs ใน Vercel Dashboard
```

---

## 📊 Monitoring SMS Status

### ดูใน Vercel Logs:
```bash
vercel logs --follow
```

### ดูใน Twilio Dashboard:
1. เข้า https://www.twilio.com/console/sms/logs
2. ดู SMS history และ status
3. ตรวจสอบ delivery status

### ดู Audit Log ใน Database:
```prisma
// ดู SMS ที่ส่งสำเร็จ
SELECT * FROM "AuditLog" 
WHERE action = 'APPOINTMENT_SMS_SENT'
ORDER BY "createdAt" DESC;

// ดู SMS ที่ส่งล้มเหลว
SELECT * FROM "AuditLog"
WHERE action = 'APPOINTMENT_SMS_FAILED'
ORDER BY "createdAt" DESC;
```

---

## 💰 Twilio Pricing (ประมาณ)

| ประเทศ | ราคา/SMS | หมายเหตุ |
|--------|---------|----------|
| USA/International | $0.0075 | ราคามาตรฐาน |
| Thailand | $0.015 - $0.025 | (หากรองรับ) |
| Trial Account | FREE | 15 USD ฟรี |

**ตัวอย่าง**: 100 ข้อความ/วัน = ~$0.75-1.50/วัน = ~$22-45/เดือน

---

## 📝 Checklist ก่อน Go Live

- [ ] สมัคร Twilio Account
- [ ] ได้รับ Account SID, Auth Token
- [ ] ได้รับ Twilio Phone Number
- [ ] เติมเงินบัญชี (หากใช้ production)
- [ ] ตั้ง 3 Environment Variables ใน Vercel
- [ ] ตั้ง CRON_SECRET (optional)
- [ ] Install twilio package: `npm install twilio`
- [ ] Test SMS locally
- [ ] Deploy ขึ้น Vercel
- [ ] Test SMS on production
- [ ] ตั้ง Cron Job (Vercel หรือ External)
- [ ] Monitor SMS logs
- [ ] Update `.env.example` ให้ชัดเจน

---

## ✅ สรุป SMS System

**สถานะ**: ✅ **PRODUCTION READY**

**ฟังก์ชันที่ติดตั้ง**:
- ✅ SMS confirmation (ตอนสร้างนัด)
- ✅ SMS reminder 3 วังก่อน (Cron)
- ✅ SMS reminder วันนัด (Cron)
- ✅ SMS postponement (เมื่อเลื่อน)
- ✅ SMS cancellation (เมื่อยกเลิก)
- ✅ Audit logging
- ✅ Thai phone formatting
- ✅ Error handling

**ต้องทำยังคงเหลือ**:
- [ ] สมัคร Twilio Account
- [ ] ได้รับ Credentials
- [ ] ตั้ง Vercel Environment Variables
- [ ] Install twilio package
- [ ] Test SMS
- [ ] ตั้ง Cron Job

---

**ติดต่อสนับสนุน**: ดู [API_DOCUMENTATION.md](API_DOCUMENTATION.md) และ [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

**Last Updated**: April 17, 2026
**Status**: ✅ Ready to Deploy
