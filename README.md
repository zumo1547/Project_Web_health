# ElderCare AI

ระบบตัวอย่างสำหรับดูแลผู้สูงอายุ โดยใช้ `Next.js` ทั้ง frontend และ backend, `PostgreSQL + Prisma`, ระบบล็อกอิน `NextAuth/Auth.js`, และพร้อมต่อกับ `Vercel` สำหรับ deploy

## Tech Stack

- Frontend: React + Next.js App Router + TypeScript
- Backend: Next.js Route Handlers
- Database: PostgreSQL + Prisma
- Auth/Security: NextAuth (Auth.js v5 beta), bcrypt, Role-based access control, Audit log
- File storage: Local uploads ใน dev และรองรับ Vercel Blob ใน production
- Deployment: Vercel
- Local team workflow: Docker + Git

## โครงสร้างหลัก

```txt
src/
  app/
    api/
      auth/[...nextauth]/route.ts
      register/route.ts
      elderly/route.ts
      elderly/[id]/route.ts
      elderly/[id]/blood-pressure/route.ts
      elderly/[id]/medicine-upload/route.ts
      elderly/[id]/ai-scan/route.ts
    login/page.tsx
    register/page.tsx
    dashboard/page.tsx
    doctor/page.tsx
    elderly/[id]/page.tsx
    layout.tsx
    page.tsx
  components/
    ui/
    forms/
    dashboard/
  lib/
    prisma.ts
    permissions.ts
    audit.ts
    storage.ts
    ai.ts
    validations.ts
  auth.ts
  types/
    next-auth.d.ts
prisma/
  schema.prisma
```

## สิ่งที่ทำไว้แล้วในโค้ดนี้

1. สมัครสมาชิกได้เป็น `DOCTOR` และ `CAREGIVER`
2. เข้าสู่ระบบด้วย email/password
3. เพิ่มข้อมูลผู้สูงอายุและเชื่อมกับคุณหมอเจ้าของเคส
4. บันทึกค่าความดันแบบ manual
5. อัปโหลดรูปยา
6. สแกน AI demo mode จากรูปยาและรูปความดัน
7. ถ้า AI อ่านค่าความดันได้ สามารถสร้าง record ให้อัตโนมัติ
8. ใช้ RBAC และตรวจสิทธิ์ซ้ำใน API
9. เขียน Audit log ตอนสร้าง user / สร้างเคส / เพิ่มความดัน / สแกน AI

## วิธีเริ่มโปรเจกต์ตั้งแต่สร้างใหม่

ถ้าจะสร้างโปรเจกต์ใหม่จากศูนย์ ให้ใช้คำสั่งแนวนี้:

```bash
npx create-next-app@latest elderly-care-ai --yes --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd elderly-care-ai
```

จากนั้นติดตั้ง package สำคัญ:

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter bcrypt zod @vercel/blob
```

เริ่ม Prisma:

```bash
npx prisma init
```

แล้วค่อยสร้าง schema, auth, route handlers, pages, forms, Docker และ README ตามตัวอย่างใน repo นี้

## วิธีรันโปรเจกต์นี้แบบ local

1. ติดตั้ง dependency

```bash
npm install
```

2. สร้างไฟล์ env

```bash
copy .env.example .env
```

3. เปิด PostgreSQL ผ่าน Docker

```bash
docker compose up -d db
```

4. generate Prisma client

```bash
npm run db:generate
```

5. sync schema ลงฐานข้อมูล

```bash
npm run db:push
```

6. เปิด dev server

```bash
npm run dev
```

7. เปิดเว็บที่

```txt
http://localhost:3000
```

## วิธีรันทุกอย่างผ่าน Docker

ถ้าทีมต้องการใช้ Docker เหมือนกันทั้งหมด:

```bash
docker compose up --build
```

จากนั้นเปิดอีก terminal เพื่อ sync schema:

```bash
docker compose exec app npm run db:push
```

## Flow การใช้งานระบบ

1. เข้า `/register` เพื่อสร้างบัญชี `DOCTOR` หรือ `CAREGIVER`
2. login ผ่าน `/login`
3. ไปหน้า `/dashboard`
4. เพิ่มข้อมูลผู้สูงอายุ
5. ถ้าจะให้หน้า `/doctor` เห็นเคส ให้กรอกอีเมลคุณหมอตอนสร้างเคส
6. เปิดหน้า `/elderly/[id]`
7. บันทึกค่าความดัน
8. อัปโหลดรูปยา
9. ใช้ AI scan เพื่อช่วยวิเคราะห์รูปยา หรืออ่านค่าความดันจากรูป

## Security ที่ใส่ไว้

- Password hash ด้วย `bcrypt`
- ใช้ `NextAuth/Auth.js` สำหรับ session และ credentials login
- ใช้ `Role-based access control`
- มี `proxy.ts` สำหรับกันหน้า protected route
- มีการตรวจสิทธิ์ซ้ำใน Route Handlers ทุกจุดสำคัญ
- ใช้ `zod` validate input
- เก็บ Audit log สำหรับ action สำคัญ

หมายเหตุสำคัญ:

- ห้ามพึ่ง `proxy.ts` อย่างเดียวสำหรับ auth
- production ควรใช้ HTTPS และตั้งค่า secret จริง
- ถ้าจะใช้งานเรื่องรูปบน Vercel จริง ให้ตั้ง `BLOB_READ_WRITE_TOKEN`

## AI mode ในโปรเจกต์นี้

ตอนนี้ `src/lib/ai.ts` เป็น `demo mode` เพื่อให้ระบบรันได้ทันทีโดยไม่ต้องมี API key

หลักการที่ใช้:

- รูปยา: เดาจาก `hint text` หรือชื่อไฟล์ เช่น `amlodipine-5mg.jpg`
- รูปความดัน: อ่าน pattern อย่าง `148/95` หรือ `pulse 88` จาก hint text หรือชื่อไฟล์

ถ้าต้องการต่อ AI vision จริงในภายหลัง ให้เปลี่ยนเฉพาะ `src/lib/ai.ts`

## Database model โดยย่อ

- `User`: ผู้ใช้งานระบบ
- `ElderlyProfile`: โปรไฟล์ผู้สูงอายุ
- `DoctorPatient`: ความสัมพันธ์หมอกับเคส
- `ElderlyCaregiver`: ความสัมพันธ์ผู้ดูแลกับเคส
- `BloodPressureRecord`: ประวัติความดัน
- `MedicineImage`: รูปยา
- `AiScan`: ผลการสแกน AI
- `AuditLog`: บันทึกการใช้งานสำคัญ

## Git workflow ที่แนะนำสำหรับทีม

1. ทุกคนเริ่มจาก branch หลักล่าสุด

```bash
git pull origin main
```

2. สร้าง branch งานของตัวเอง

```bash
git checkout -b feature/doctor-dashboard
```

3. ทำงานและ commit ให้ข้อความชัดเจน

```bash
git add .
git commit -m "Add doctor dashboard flow"
```

4. push และเปิด Pull Request

```bash
git push origin feature/doctor-dashboard
```

## คำสั่งที่ใช้บ่อย

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:studio
docker compose up --build
docker compose down -v
```

## Deploy ไป Vercel

1. Push โค้ดขึ้น GitHub
2. Import โปรเจกต์เข้า Vercel
3. ตั้งค่า Environment Variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `APP_URL`
   - `BLOB_READ_WRITE_TOKEN` (ถ้าใช้)
4. ใช้ PostgreSQL production จริง เช่น Neon, Supabase หรือ managed Postgres อื่น
5. รัน migration หรือ `prisma db push` กับฐานข้อมูล production

## Official references

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js proxy / migration docs](https://nextjs.org/docs/app/guides/upgrading/codemods)
- [Auth.js / NextAuth](https://authjs.dev/)
- [Prisma ORM](https://www.prisma.io/docs/orm)
- [Prisma v7 upgrade guide](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Vercel Blob](https://vercel.com/docs/vercel-blob)
