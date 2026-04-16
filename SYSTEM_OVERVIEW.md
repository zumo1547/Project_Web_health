# 🏥 Elderly Care AI - System Overview

## 📋 Project Summary

**Elderly Care AI** is a comprehensive health monitoring web application designed specifically for elderly users. It enables elderly users to track their health, upload medicine information, receive AI-powered health summaries, and connect with doctors through a structured case workflow system.

### Key Purpose
- **For Elderly Users**: Easy-to-use health record management with large text, clear buttons, and accessible design
- **For Doctors**: Review patient health records, chat with patients, and manage cases
- **For Admins**: Oversee the entire system, manage users, assign doctors, and monitor activity

---

## 🏗️ Technology Stack

### Core Framework
- **Next.js 16.2.2** - React-based full-stack framework
- **React 19.2.4** - Modern UI library with concurrent features
- **TypeScript 5.9.3** - Type-safe development

### Database & ORM
- **PostgreSQL** - Primary relational database
- **Prisma 7.6.0** - Type-safe ORM with migration support
- **Neon** - Serverless PostgreSQL option for production

### Authentication
- **NextAuth.js 5.0.0-beta.30** - Session and authentication management
  - OAuth providers: Google, Facebook
  - Credentials provider: Email/password with bcrypt hashing
  - JWT session strategy

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Hook Form** - Efficient form state management
- **Zod** - Runtime type validation for data

### AI & Image Processing
- **Tesseract.js 7.0.0** - OCR for medicine label recognition
- **Sharp 0.34.5** - Image processing and optimization
- **Claude API** - AI health summaries and guidance (via backend)

### File Storage
- **Vercel Blob** - Cloud storage for medicine/BP images

### Utilities
- **Date-fns 4.1.0** - Date manipulation
- **Pino 10.3.1** - Logging
- **bcrypt** - Password hashing

### Deployment
- **Vercel** - Hosting and CI/CD
- **Docker** - Local development containerization

---

## 🗂️ Project Structure

```
elderly-care-ai/
├── src/
│   ├── app/                          # Next.js App Router (Pages)
│   │   ├── page.tsx                  # Home landing page
│   │   ├── dashboard/                # Auth dashboard (redirects to portal)
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registration page
│   │   ├── start/                    # Role selection page
│   │   ├── complete-profile/         # Profile completion onboarding
│   │   ├── elderly-portal/           # Elderly user dashboard
│   │   ├── doctor/                   # Doctor dashboard (list of patients)
│   │   ├── doctor-login/             # Doctor login
│   │   ├── admin/                    # Admin portal
│   │   ├── admin-login/              # Admin login
│   │   ├── elderly/[id]/             # Elderly profile details (doctor view)
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # NextAuth callbacks
│   │   │   ├── elderly/              # Elderly data endpoints
│   │   │   ├── appointments/         # Appointment management
│   │   │   ├── admin/                # Admin-specific endpoints
│   │   │   └── register/             # Registration logic
│   │   └── layout.tsx                # Root layout wrapper
│   │
│   ├── components/
│   │   ├── admin/                    # Admin-specific components
│   │   │   ├── admin-user-management.tsx
│   │   │   ├── admin-profile-management.tsx
│   │   │   ├── admin-appointment-management.tsx
│   │   │   └── admin-case-assignment.tsx
│   │   ├── dashboard/                # Dashboard components
│   │   │   ├── app-shell.tsx         # Layout wrapper
│   │   │   ├── summary-card.tsx      # Stat cards (BP, medicines, etc.)
│   │   │   ├── doctor-appointment-list.tsx
│   │   │   ├── doctor-case-action-button.tsx
│   │   │   ├── elderly-appointment-history.tsx
│   │   │   ├── elderly-table.tsx
│   │   │   └── quick-action-card.tsx
│   │   ├── elderly/                  # Elderly-specific components
│   │   │   └── health-records-tabs.tsx  # Interactive tabs for BP, medicines, AI scans
│   │   ├── forms/                    # Form components
│   │   │   ├── login-form.tsx
│   │   │   ├── elderly-form.tsx
│   │   │   ├── blood-pressure-form.tsx
│   │   │   ├── ai-scan-form.tsx
│   │   │   ├── chat-panel.tsx        # Chat interface
│   │   │   ├── ai-health-chat-panel.tsx
│   │   │   ├── doctor-appointment-form.tsx
│   │   │   ├── doctor-hospital-share-panel.tsx  # Hospital carousel
│   │   │   ├── appointment-chat-integration.tsx
│   │   │   ├── elderly-profile-settings-form.tsx
│   │   │   ├── image-source-picker.tsx
│   │   │   ├── case-request-panel.tsx
│   │   │   └── record-delete-button.tsx
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── ...more UI components
│   │   ├── auth/                     # Auth components
│   │   ├── providers/                # Context providers
│   │   └── ...
│   │
│   ├── lib/                          # Utility functions
│   │   ├── ai.ts                     # AI processing (OCR, Claude)
│   │   ├── case-management.ts        # Case workflow logic
│   │   ├── elderly-profile.ts        # Elderly profile helpers
│   │   ├── health-presenters.ts      # BP assessment, case status display
│   │   ├── appointment-management.ts # Appointment CRUD
│   │   ├── appointment-sms.ts        # SMS notifications
│   │   ├── hospital-map.ts           # Hospital location data
│   │   ├── permissions.ts            # Role-based access control
│   │   ├── storage.ts                # File upload to Vercel Blob
│   │   ├── audit.ts                  # Activity logging
│   │   ├── date-time.ts              # Date formatting utilities
│   │   ├── validations.ts            # Zod schemas
│   │   └── prisma.ts                 # Prisma singleton
│   │
│   ├── types/
│   │   └── next-auth.d.ts           # NextAuth type extensions
│   │
│   ├── generated/
│   │   └── prisma/                   # Auto-generated Prisma types
│   │
│   ├── auth.ts                       # NextAuth configuration
│   ├── proxy.ts                      # API proxy utilities
│   └── globals.css                   # Global Tailwind styles
│
├── prisma/
│   └── schema.prisma                 # Database schema definition
│
├── scripts/
│   ├── build-with-prisma.mjs         # Custom build script
│   ├── create-admin.mjs              # Admin user creation
│   └── db-push-neon.mjs              # Database push to Neon
│
├── public/
│   └── uploads/                      # Local image storage
│
├── docker-compose.yml                # Local dev environment
├── Dockerfile                        # Container configuration
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript settings
├── package.json                      # Dependencies
├── README.md                         # Documentation
└── SYSTEM_OVERVIEW.md                # This file
```

---

## 📊 Database Schema (Key Models)

### User Management
- **User**: Accounts with roles (ADMIN, DOCTOR, CAREGIVER, ELDERLY)
  - Email-based authentication
  - Password hashing with bcrypt
  - OAuth account linking

- **ElderlyProfile**: Extended profile for elderly users
  - Personal info (name, birthdate, phone, address)
  - Health info (allergies, chronic diseases)
  - Location tracking
  - Profile completion status
  - Case status (SELF_SERVICE, WAITING_DOCTOR, IN_REVIEW, COMPLETED)

- **DoctorPatient**: Relationship between doctors and elderly patients
  - Status: ACTIVE or COMPLETED
  - Tracks when cases were closed

### Health Records
- **BloodPressureRecord**: BP measurements
  - Systolic/Diastolic values
  - Pulse rate
  - Measurement timestamp
  - Method (manual or scanned)

- **MedicineImage**: Uploaded medicine photos
  - Image URL (Vercel Blob)
  - AI-extracted labels and notes
  - Upload timestamp

- **AiScan**: Medicine label analysis
  - Type (MEDICINE_IMAGE or BLOOD_PRESSURE_IMAGE)
  - OCR results
  - Confidence score
  - Status (PENDING, COMPLETED, FAILED, REVIEWED)

### Communication
- **ChatMessage**: Messages between users and AI
  - Role (user or assistant)
  - Content
  - Sender information
  - Conversation context

- **AiHealthMessage**: Health-specific AI conversation
  - Used for health advice and summaries

### Case & Appointment Management
- **DoctorPatient**: Case relationships
- **Appointment**: Scheduled doctor visits
  - Status (SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED)
  - Doctor and elderly user assignment

- **AppointmentReschedule**: Reschedule tracking with reasons

### Audit
- **AuditLog**: System activity logging
  - Action type
  - User and affected entity
  - Timestamp
  - Details

---

## 🔐 Authentication & Authorization

### Authentication Methods
1. **Email/Password**: Credentials provider with bcrypt hashing
2. **Google OAuth**: Social login integration
3. **Facebook OAuth**: Social login integration

### Role-Based Access Control (RBAC)
```typescript
enum Role {
  ADMIN      // Full system access, user management
  DOCTOR     // Access to assigned patients, case management
  CAREGIVER  // Legacy role
  ELDERLY    // Access to own profile only
}
```

### Portal Access
- **Admin Portal** (`/admin`): ADMIN only
- **Doctor Portal** (`/doctor`): DOCTOR and ADMIN
- **Elderly Portal** (`/elderly-portal`): ELDERLY only

### Data Access Patterns
- **Elderly**: Can only view/edit their own profile
- **Doctors**: Can only access profiles of assigned patients
- **Admins**: Can access all profiles and manage system

---

## 🎯 Key Features

### 1. Elderly User Portal (`/elderly-portal`)
- **Health Record Management**
  - Blood pressure recording (manual or image scan)
  - Medicine photo upload with AI label extraction
  - Health history view

- **AI-Assisted Health Guidance**
  - Chat with AI assistant about health records
  - Blood pressure assessment and warnings
  - Medicine identification from photos

- **Doctor Case Request**
  - Request professional medical consultation
  - Track case status (waiting, in review, completed)
  - Communicate with assigned doctor

- **Appointment Management**
  - View scheduled appointments
  - Appointment history

### 2. Doctor Portal (`/doctor`)
- **Patient List**: View all assigned elderly patients
- **Patient Profile** (`/elderly/[id]`)
  - Health records with 3-column layout:
    - Column 1: Profile info + Health records tabs (BP, medicines, AI scans)
    - Column 2: Chat panel for case communication
    - Column 3: Appointment forms + Hospital share + Contact info
  - Interactive health records tabs:
    - Blood Pressure: View and delete records
    - Medicines: Scanned medicine images with confidence scores
    - AI Scans: OCR results with confidence metrics
  - Hospital carousel: Nearby hospitals with distance info
  - Quick action buttons: Edit profile, manage appointments, close cases

- **Case Management**
  - Accept/reject case requests
  - Chat with patient through unified chat interface
  - Close completed cases

- **Appointment Scheduling**
  - Create appointments
  - Track appointment status
  - Handle reschedules

### 3. Admin Portal (`/admin`)
- **User Management**
  - Create/edit users (elderly, doctors, admins)
  - Role assignment
  - Account status management

- **Case Assignment**
  - Assign doctors to elderly patients
  - Monitor active cases
  - Review case status

- **Profile Management**
  - View and edit user profiles
  - Monitor onboarding status

- **Activity Monitoring**
  - Audit logs
  - System usage statistics

- **Appointment Management**
  - View all appointments
  - Handle appointment issues
  - Reschedule appointments

---

## 🔄 Core Workflows

### Workflow 1: Elderly User Registration & Onboarding
```
Register → Create ElderlyProfile → Complete Profile Info → Access Portal
```

### Workflow 2: Health Record Entry
```
Blood Pressure Entry (Manual or Image)
↓
If Image: OCR Processing via Tesseract
↓
AI Assessment: Blood pressure categorization (emerald/amber/rose)
↓
Display: Health Record Tabs (blood-pressure | medicines | ai-scans)
```

### Workflow 3: Case Request Workflow
```
Elderly: Send case request → Status: WAITING_DOCTOR
↓
Doctor: Accept case → Status: IN_REVIEW
↓
Doctor & Elderly: Chat communication
↓
Doctor: Close case → Status: COMPLETED
```

### Workflow 4: Doctor Reviews Patient
```
Doctor logs in → Patient list → Click patient ID
↓
Load elderly profile with:
  - Summary cards (BP, medicines, AI scans, case status)
  - Health records tabs (3-column layout)
  - Chat with patient
  - Hospital nearby info
  - Appointment management
↓
Doctor can:
  - Review health history
  - Chat about case
  - Schedule appointments
  - Manage case status
```

---

## 🎨 Key UI Components

### Summary Cards
- Blood pressure (latest + assessment)
- Health history count
- Medicines/AI scans count
- Case status

### Health Records Tabs (3 Tabs)
```
┌─────────────┬──────────────┬──────────┐
│ Blood Press │  Medicines   │ AI Scans │
└─────────────┴──────────────┴──────────┘
```
- Each tab shows scrollable list (max-h-[600px])
- Enhanced buttons: "🔍 เปิดรูป" with gradient styling
- Delete capability for authenticated users

### Hospital Carousel
```
┌──────────────────────────────────────────┐
│ [Hospital1]  [Hospital2]  [Hospital3] →  │
│ min-w-[300px] per card, horizontally     │
│ scrollable with fixed widths              │
└──────────────────────────────────────────┘
```
- Distance badge with rose styling
- Map link and chat share buttons

### Chat Panel
- User messages (right-aligned)
- AI/Doctor messages (left-aligned)
- Input field with send button
- Message preview in profile view

---

## 📡 API Routes Structure

### Authentication (`/api/auth`)
- NextAuth callbacks and handlers
- Credentials verification
- OAuth integration

### Elderly Profile (`/api/elderly`)
- GET/POST elderly profile data
- Health record endpoints
- Chat message handling
- AI processing endpoints

### Appointments (`/api/appointments`)
- Create/update/cancel appointments
- List appointments
- Reschedule handling

### Admin (`/api/admin`)
- User management
- Case assignment
- System monitoring
- Statistics

### Registration (`/api/register`)
- User account creation
- Profile initialization
- Email verification

---

## 🤖 AI Integration

### OCR Processing (Tesseract.js)
- Medicine label recognition from uploaded images
- Blood pressure reading extraction from photos
- Confidence scoring (0-100)

### Health Summaries (Claude API)
- Context-aware health guidance based on:
  - Latest blood pressure
  - Current medicines
  - Chronic diseases
  - Allergies
- Markdown-formatted responses in Thai
- Integration with chat panel

### Known Medicines Database
- Pre-configured Thai medicine names
- Common usage patterns
- Drug interactions awareness

---

## 🔒 Security Measures

1. **Authentication**
   - NextAuth.js with JWT
   - Bcrypt password hashing
   - Session-based access control

2. **Authorization**
   - Role-based access control (RBAC)
   - Data-level permissions
   - Doctor-patient relationship verification

3. **Data Protection**
   - Environment variables for secrets
   - Encrypted database connections
   - Audit logging for sensitive actions

4. **Image Security**
   - Vercel Blob storage
   - URL-based access control
   - File type validation

---

## 🚀 Deployment

### Development
```bash
npm install
docker compose up -d db      # Start PostgreSQL
npm run db:generate          # Generate Prisma types
npm run db:push              # Sync schema
npm run dev                  # Start dev server (http://localhost:3000)
```

### Production (Vercel + Neon)
1. Connect Neon PostgreSQL database
2. Configure environment variables:
   - DATABASE_URL
   - DATABASE_URL_UNPOOLED
   - AUTH_SECRET
   - NEXTAUTH_URL
   - BLOB_READ_WRITE_TOKEN
3. Deploy to Vercel
4. Run: `npm run db:push:neon` and `npm run db:create-admin`

### Docker Deployment
```bash
docker compose up --build
```

---

## 🔧 Build & Scripts

- `npm run dev` - Start development server
- `npm run build` - Custom build with Prisma sync
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Sync Prisma schema to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:create-admin` - Create admin user

---

## ⚠️ Important Notes

### Medical Disclaimer
- **NOT** a certified medical device
- Should **NOT** replace professional medical advice
- For emergencies: Contact hospital/emergency services immediately
- AI may misread labels or images, especially with poor quality

### Privacy & Safety Checklist
Before deploying:
- ❌ Never commit `.env` files with real secrets
- ❌ Never use real patient data in demo
- ❌ Never upload photos with personal identifiable information
- ✅ Rotate secrets if accidentally exposed
- ✅ Set up BLOB_READ_WRITE_TOKEN for production

---

## 📈 Recent Features (Commit 9ccdca4)

### Enhanced UI/UX
1. **HealthRecordsTabs Component** - Interactive tabs for health records
2. **3-Column Profile Layout** - Optimized doctor review interface
3. **Hospital Carousel** - Horizontal scrollable hospital listing
4. **Enhanced Buttons** - Gradient styling on action buttons
5. **Information Cards** - Doctor list, contact info, health alerts

### Architecture Improvements
- Clean component separation
- Responsive grid layouts
- Optimized data queries
- Performance-focused rendering

---

## 📞 Contact & Support

This system is designed for:
- **Elderly Users**: Easy health tracking and doctor communication
- **Healthcare Providers**: Efficient patient monitoring and case management
- **System Administrators**: Complete system oversight and user management

For questions or issues, refer to the README.md or project documentation.

---

**Last Updated**: April 2026
**Current Commit**: 9ccdca4
**Status**: Active Development
