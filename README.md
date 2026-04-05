# Senior Health Check

แอปต้นแบบสำหรับติดตามสุขภาพผู้สูงอายุ โดยเน้นการใช้งานง่ายบนมือถือและคอมพิวเตอร์ ผู้สูงอายุสามารถบันทึกค่าความดัน อัปโหลดรูปยา ขอคำแนะนำจากระบบ AI และติดต่อคุณหมอผ่านระบบเคสได้ ส่วนคุณหมอและแอดมินสามารถติดตามแฟ้มสุขภาพ ดูประวัติการอัปโหลด และจัดการเคสได้จากหน้าเว็บเดียว

Senior Health Check is a prototype web app for elderly health monitoring. It is designed to be easy to use on both phones and computers. Elderly users can record blood pressure, upload medicine photos, get AI-assisted hints, and contact doctors through a case workflow. Doctors and admins can review health records, uploaded history, and active cases in one place.

## What This Web App Does

- ผู้สูงอายุสมัครและเข้าสู่ระบบเพื่อใช้งานแฟ้มสุขภาพของตัวเอง
- บันทึกค่าความดันได้ทั้งแบบกรอกเองและสแกนจากรูป
- อัปโหลดหรือถ่ายรูปยาเพื่อให้ระบบช่วยอ่านข้อมูลเบื้องต้น
- แชทกับ AI เพื่อสรุปข้อมูลสุขภาพแบบเข้าใจง่าย
- ส่งข้อความขอคำปรึกษาเพื่อให้คุณหมอรับเคส
- คุณหมอดูประวัติสุขภาพ เปิดแฟ้ม แชทกับผู้สูงอายุ และปิดเคสได้
- แอดมินดูภาพรวมผู้ใช้ จัดการสิทธิ์ จับคู่หมอกับผู้สูงอายุ และตรวจสอบข้อมูลได้

- Elderly users can sign up and access their own health record.
- Blood pressure can be added manually or scanned from an image.
- Medicine photos can be uploaded from desktop or captured from a phone camera.
- The app provides AI-assisted summaries and simple health guidance.
- Doctors can accept cases, open patient records, chat, and close cases.
- Admins can manage users, assignments, and overall system activity.

## Main Features

- Elderly health profile and health history
- Medicine image upload with AI/OCR-assisted interpretation
- Blood pressure recording and basic risk hinting
- Case request flow between elderly users and doctors
- Chat between elderly users, doctors, and AI assistant
- Admin tools for user management and case assignment
- Audit logging and role-based access control

## Quick Start

### Local development

```bash
npm install
copy .env.example .env
docker compose up -d db
npm run db:generate
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Neon + Vercel

1. Connect a PostgreSQL database such as Neon.
2. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED` or `POSTGRES_URL_NON_POOLING`
   - `AUTH_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `APP_URL`
   - `BLOB_READ_WRITE_TOKEN` for production image uploads
3. Create a local `.env.local` with your non-pooling database URL.
4. Run:

```bash
npm run db:push:neon
npm run db:create-admin
```

The Vercel build step now syncs the Prisma schema before running `next build`, so production stays aligned with the deployed code as long as a non-pooling database URL is available.

## Important Notes

### ภาษาไทย

- โปรเจกต์นี้ทำขึ้นเพื่อการศึกษา การทดลองระบบ และการสาธิตแนวคิดเท่านั้น
- ไม่ใช่อุปกรณ์การแพทย์ และไม่ควรใช้แทนคำวินิจฉัยจากแพทย์จริง
- ผล AI อาจอ่านรูปผิด ตีความผิด หรือให้คำแนะนำไม่ครบ โดยเฉพาะเมื่อรูปไม่ชัด แสงน้อย หรือมีข้อมูลถูกบัง
- หากมีอาการฉุกเฉิน เช่น เจ็บหน้าอก หายใจลำบาก แขนขาอ่อนแรงเฉียบพลัน หรือความดันสูงผิดปกติอย่างรุนแรง ควรติดต่อโรงพยาบาลหรือหน่วยฉุกเฉินทันที

### English

- This project is for education, prototyping, and demonstration purposes only.
- It is not a certified medical device and must not replace professional medical judgment.
- The AI layer may misread labels, images, or blood pressure values, especially when the image quality is poor.
- For emergencies or urgent symptoms, users should contact a real hospital or emergency service immediately.

## Privacy and Safety

ก่อนอัปขึ้น GitHub หรือเปิดเดโมสาธารณะ ควรตรวจสอบดังนี้:

- อย่าอัปโหลดไฟล์ `.env`, `.env.local`, database URLs, secrets, tokens, หรือรหัสผ่านจริงขึ้น Git
- อย่าใช้ข้อมูลผู้ป่วยจริงในการเดโมสาธารณะ
- อย่าอัปโหลดรูปที่มีเลขบัตรประชาชน เบอร์โทร ที่อยู่เต็ม ชื่อ-นามสกุลจริง หมายเลขโรงพยาบาล หรือข้อมูลส่วนตัวที่ระบุตัวบุคคลได้
- หากเคยเผลอเปิดเผยรหัสผ่านฐานข้อมูลหรือ secret มาก่อน ควร rotate หรือ reset ใหม่ก่อน deploy
- สำหรับ production บน Vercel หากต้องใช้อัปโหลดรูปจริง ควรตั้งค่า `BLOB_READ_WRITE_TOKEN`

Before publishing the project or making the repository public:

- Do not commit `.env`, `.env.local`, database URLs, secrets, tokens, or real passwords
- Do not use real patient data in a public demo
- Avoid uploading photos that expose IDs, phone numbers, full addresses, hospital numbers, or other personally identifiable information
- Rotate any credential that may have been exposed before deployment
- Set `BLOB_READ_WRITE_TOKEN` if you want production uploads to work on Vercel

## Repository Notes

- Environment files are intentionally excluded from Git, except for `.env.example`
- Temporary local upload data should not be committed
- Temporary development logs should not be committed
- This repository is best used as a learning and prototype base for a healthcare workflow app

## Tech Stack

- Next.js App Router
- React + TypeScript
- PostgreSQL + Prisma
- Auth.js / NextAuth
- Docker for local database workflow
- Vercel for deployment

## License / Usage

ใช้งานเพื่อการศึกษา การทดลอง และการพัฒนาต้นแบบได้ตามความเหมาะสม แต่ควรทบทวนด้านกฎหมาย ความปลอดภัย และความเป็นส่วนตัวก่อนนำไปใช้กับข้อมูลจริง

Use this project for learning, experimentation, and prototyping. Review privacy, legal, security, and medical compliance requirements before using it with real-world data.
