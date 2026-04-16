# 🚀 SMS Notification System - Quick Setup (5 Steps)

## ⏱️ เวลา: ~15 นาที เท่านั้น

---

## Step 1️⃣: สมัคร Twilio (3 นาที)

### 1. เข้าสมัคร
```
ไปที่: https://www.twilio.com/console
สมัครใจม: ใส่ email + password
ยืนยัน: Check email + OTP
```

### 2. ได้รับ Credentials
หลังจากสมัครเสร็จ ในหน้า Twilio Console คุณจะเห็น:
- **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

✅ **คัดลอกทั้ง 2 อย่างไว้**

---

## Step 2️⃣: ได้รับ Twilio Phone Number (2 นาที)

### 1. ไปหน้า Phone Numbers
```
Twilio Console → Phone Numbers → Get a Number
```

### 2. เลือก Country & Type
- Country: เลือก Thailand (หรือ US ก่อน)
- Type: SMS
- Click "Get a Number"

### 3. Confirm & Keep
Twilio จะให้เบอร์ชั่วคราว เช่น: `+1 234 567 8900`
- Click "Keep This Number"

✅ **คัดลอกเบอร์นี้ไว้**

---

## Step 3️⃣: ตั้ง Vercel Environment Variables (5 นาที)

### 1. เข้า Vercel Dashboard
```
https://vercel.com/dashboard
```

### 2. เลือก Project
```
Project_Web_health → Settings → Environment Variables
```

### 3. เพิ่ม 4 ตัวแปร

#### Variable #1: TWILIO_ACCOUNT_SID
```
Name:  TWILIO_ACCOUNT_SID
Value: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (จากขั้นตอนที่ 1)
Environment: Production, Preview, Development
```

#### Variable #2: TWILIO_AUTH_TOKEN
```
Name:  TWILIO_AUTH_TOKEN
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (จากขั้นตอนที่ 1)
Environment: Production, Preview, Development
```

#### Variable #3: TWILIO_PHONE_NUMBER
```
Name:  TWILIO_PHONE_NUMBER
Value: +1234567890 (จากขั้นตอนที่ 2)
Environment: Production, Preview, Development
```

#### Variable #4: CRON_SECRET (ให้ความปลอดภัย)
```
Name:  CRON_SECRET
Value: your-secret-key-12345 (เลือกอะไรก็ได้ ยาว ๆ หน่อย)
Environment: Production, Preview, Development
```

✅ **Save ทั้งหมด 4 ตัวแปร**

---

## Step 4️⃣: Deploy ขึ้น Vercel (2 นาที)

### ในเครื่องของคุณ:

```bash
# ไปโฟลเดอร์ project
cd ~/Downloads/Web_health/elderly-care-ai

# Install twilio
npm install twilio

# Commit changes
git add .
git commit -m "feat: Add SMS notification system with Twilio"

# Push ขึ้น GitHub
git push origin main
```

✅ **Vercel auto-deploys** (รอ ~2 นาที)

---

## Step 5️⃣: Test SMS (3 นาที)

### ทดสอบว่า SMS ส่งได้ไหม

#### Option A: Test via API

```bash
# ทดสอบการสร้างนัด (ส่ง SMS ยืนยัน)
curl -X POST http://localhost:3000/api/appointments?action=create \
  -H "Content-Type: application/json" \
  -d '{
    "elderlyId": "elderly-id-here",
    "doctorId": "doctor-id-here",
    "appointmentDate": "2026-04-25T10:00:00Z"
  }'
```

#### Option B: ตรวจสอบ Vercel Logs

```bash
# ดูว่า SMS ส่งไป่ยังไง
vercel logs --follow

# ดู output:
# [SMS Sent] SID: SMxxxxxxxxxxxxxxx, To: +66812345678
```

---

## ✅ เสร็จแล้ว! 

### สิ่งที่ทำงานแล้ว:

✅ SMS confirmation - ส่งตอนสร้างนัด
✅ SMS reminder 3 วันก่อน - ส่งอัตโนมัติ (Cron)
✅ SMS reminder วันนัด - ส่งอัตโนมัติ (Cron)
✅ SMS postponement - ส่งเมื่อเลื่อนนัด
✅ SMS cancellation - ส่งเมื่อยกเลิกนัด

---

## 📋 ต้องตรวจสอบเพิ่มเติม

### 1. Cron Job (ส่ง SMS ทุกวัน)
ระบบจะส่ง SMS ทุกวัน เวลา 7-8 นาฬิกา (UTC) โดยอัตโนมัติ

ตรวจสอบ:
```
Vercel Dashboard → Crons → Check schedule
```

### 2. Monitor SMS Status
```
Twilio Dashboard → SMS → Logs
ดูว่า SMS ส่งไปได้ไหม (delivered / failed)
```

### 3. Audit Log (ดูประวัติ SMS)
```bash
npm run db:studio

# ดู AuditLog table
# ค้นหา action: "APPOINTMENT_SMS_SENT"
```

---

## 💰 เรื่องราคา

### ทดสอบ (Trial):
- **ฟรี 15 USD** ที่ได้มา
- ส่ง SMS ได้ ~10-15 ข้อความ
- เพียงพอสำหรับทดสอบ

### Production:
- **ราคา**: $0.0075-0.015 ต่อ SMS
- **ตัวอย่าง**: 100 SMS/วัน = ~$0.75-1.50/วัน = ~$22-45/เดือน
- ต้อง **Add Payment Method** ใน Twilio

---

## ⚠️ ถ้ามีปัญหา

### SMS ไม่ส่ง?
```
1. ตรวจสอบ Environment Variables ถูกต้องไหม
2. ดู Vercel logs: vercel logs
3. ตรวจสอบ phone number format: 0812345678 → +66812345678
4. ตรวจสอบ Twilio Dashboard: SMS logs
```

### Cron ไม่ทำงาน?
```
1. ตรวจสอบ vercel.json มี crons ไหม
2. ดู Vercel Dashboard → Crons
3. ตรวจสอบ CRON_SECRET ถูกต้องไหม
```

### Phone format ผิด?
```
ระบบจะแปลงให้อัตโนมัติ:
0812345678 → +66812345678 ✅
6681234567 → +66812345678 ✅
+66812345678 → +66812345678 ✅
```

---

## 📞 SMS ที่จะส่ง

### 1. Confirmation (ตอนสร้างนัด)
```
✅ นัดหมายของคุณได้รับการยืนยันแล้ว

📅 วันที่นัด: [วันที่]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

ติดตามสถานะได้ที่แอปนะคะ
```

### 2. Reminder 3 วันก่อน
```
สวัสดีคุณ[ชื่อ] 😊

การนัดหมายของคุณกล่าวมา!

📅 วันที่นัด: [วันที่]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

พบกันเร็วๆ นี้ที่คลินิก

หากต้องเลื่อนวัน โปรดแจ้งแอปหลัง 24 ชั่วโมงข้างหน้า
```

### 3. Reminder วันนัด
```
สวัสดีคุณ[ชื่อ] 👋

วันนี้คือวันนัดหมายของคุณ!

📅 เวลา: [เวลา]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

กรุณาเตรียมตัวให้พร้อม
```

### 4. Postponement (เลื่อนนัด)
```
📅 วันนัดหมายของคุณเลื่อนวันแล้ว

เดิม: [วันเดิม]
ใหม่: [วันใหม่]

เหตุผล: [เหตุผล]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

เข้าแอปเพื่อเห็นรายละเอียด
```

### 5. Cancellation (ยกเลิกนัด)
```
❌ การนัดหมายของคุณถูกยกเลิก

📅 วันที่นัด: [วันที่]
👨‍⚕️ คุณหมอ: [ชื่อหมอ]

โปรดติดต่อแอปเพื่อจัดเวลาใหม่
```

---

## 📖 ต้องการอ่านเพิ่มเติม?

ดู: [SMS_SETUP_GUIDE.md](SMS_SETUP_GUIDE.md) - คำแนะนำอย่างละเอียด

---

**Status**: ✅ **READY TO USE**
**Time to Setup**: ~15 minutes
**Difficulty**: ⭐ Easy
