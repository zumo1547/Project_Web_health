# Database Schema Documentation

## Entity Relationship Diagram

```
User (Auth & Roles)
├── ElderlyProfile (1:1) - Elderly user extended profile
├── DoctorPatient (1:N) - Doctors assigned to elderly
├── ChatMessage (1:N) - Chat messages sent by user
├── BloodPressureRecord (1:N) - BP records created by doctor/system
├── MedicineImage (1:N) - Medicine photos uploaded
├── AiScan (1:N) - AI scan reviews
├── Appointment (1:N) - Appointments as doctor
└── Account (1:N) - OAuth accounts linked

ElderlyProfile (Patient Profile)
├── BloodPressureRecord (1:N) - BP measurements
├── MedicineImage (1:N) - Medicine photos
├── AiScan (1:N) - AI analysis results
├── DoctorPatient (1:N) - Assigned doctors
├── ChatMessage (1:N) - Chat history
├── AiHealthMessage (1:N) - Health chat with AI
└── Appointment (1:N) - Scheduled appointments

DoctorPatient (Case)
├── User (Doctor)
└── ElderlyProfile (Patient)

Appointment
├── ElderlyProfile (Patient)
├── User (Doctor)
├── AppointmentReschedule (1:N) - Reschedule history
└── AppointmentHistory (1:N) - Historical records
```

---

## Core Tables

### 1. User (Authentication & Authorization)

**Purpose**: Central authentication and user management

**Fields**:
```typescript
id: String @id @default(cuid())              // Unique identifier
name: String                                  // User display name
email: String @unique                         // Email login
emailVerified: DateTime?                      // Email verification timestamp
image: String?                                // Profile picture URL
passwordHash: String?                         // Bcrypt hashed password
role: Role @default(ELDERLY)                 // ADMIN | DOCTOR | CAREGIVER | ELDERLY
createdAt: DateTime @default(now())          // Account creation time
updatedAt: DateTime @updatedAt               // Last update time
```

**Key Relationships**:
- `doctorPatients`: Cases where user is doctor
- `caregiverPatients`: Elderly users under care
- `elderlyProfile`: Associated elderly profile (for ELDERLY role)
- `createdBloodPressures`: BP records created
- `uploadedMedicineImages`: Medicine images uploaded
- `reviewedScans`: AI scans reviewed
- `sentChatMessages`: Chat messages sent
- `accounts`: OAuth accounts linked

**Important**:
- Each user can have at most one ElderlyProfile
- Doctors are DOCTOR role users
- Admins are ADMIN role users

---

### 2. ElderlyProfile (Patient Health Records)

**Purpose**: Extended elderly user profile with health information

**Fields**:
```typescript
id: String @id @default(cuid())              // Profile ID
titlePrefix: String?                         // Mr./Mrs./Miss
firstName: String                            // First name
lastName: String                             // Last name
nationalId: String? @unique                  // ID card number
elderlyUserId: String? @unique               // Links to User.id
birthDate: DateTime?                         // Date of birth
gender: Gender?                              // MALE | FEMALE | OTHER
phone: String?                               // Contact phone
address: String?                             // Home address
allergies: String?                           // Known allergies (memo)
chronicDiseases: String?                     // Chronic conditions (memo)
notes: String?                               // General notes
lastKnownLatitude: Float?                    // Last location latitude
lastKnownLongitude: Float?                   // Last location longitude
lastKnownLocationLabel: String?              // Location name
lastKnownLocationUpdatedAt: DateTime?        // Location update time
caseStatus: CaseStatus @default(SELF_SERVICE) // Current case status
doctorRequestNote: String?                   // Request message to doctor
doctorRequestedAt: DateTime?                 // When doctor was requested
onboardingRequired: Boolean @default(false)  // Profile completion needed
profileCompletedAt: DateTime?                // When profile was completed
createdAt: DateTime @default(now())          // Profile creation
updatedAt: DateTime @updatedAt               // Last profile update
```

**Case Status Flow**:
```
SELF_SERVICE → WAITING_DOCTOR → IN_REVIEW → COMPLETED
  (initial)    (requesting)    (accepted)   (closed)
```

**Key Relationships**:
- `elderlyUser`: Linked User account
- `bloodPressures`: Blood pressure records
- `medicineImages`: Medicine photos
- `aiScans`: AI analysis results
- `doctors`: Assigned doctors (DoctorPatient)
- `caregivers`: Associated caregivers
- `chatMessages`: Chat history
- `aiHealthMessages`: Health chat history
- `appointments`: Scheduled appointments

---

### 3. DoctorPatient (Case Management)

**Purpose**: Represents a case between doctor and elderly patient

**Fields**:
```typescript
id: String @id @default(cuid())              // Case ID
doctorId: String                             // Doctor's User ID
elderlyId: String                            // Elderly patient ID
status: DoctorCaseStatus @default(ACTIVE)   // ACTIVE | COMPLETED
closedNote: String?                          // Reason for closure
completedAt: DateTime?                       // When case was closed
createdAt: DateTime @default(now())          // Case creation date

@@unique([doctorId, elderlyId])              // One case per doctor-patient pair
```

**Status Meanings**:
- **ACTIVE**: Doctor is actively managing this patient
- **COMPLETED**: Case closed by doctor

**Relationships**:
- `doctor`: Linked User (doctor)
- `elderly`: Linked ElderlyProfile (patient)

---

### 4. BloodPressureRecord (Vital Signs)

**Purpose**: Store blood pressure measurements

**Fields**:
```typescript
id: String @id @default(cuid())              // Record ID
elderlyId: String                            // Patient ID
systolic: Int                                // Systolic pressure (mmHg)
diastolic: Int                               // Diastolic pressure (mmHg)
pulse: Int?                                  // Heart rate (bpm, optional)
measuredAt: DateTime                         // When measurement was taken
sourceImageUrl: String?                      // URL if scanned from image
note: String?                                // User notes
createdById: String?                         // Who created the record
createdAt: DateTime @default(now())          // Record creation time
```

**Relationships**:
- `elderly`: ElderlyProfile
- `createdBy`: User (doctor/caregiver who entered it)

**Assessment Logic** (in `health-presenters.ts`):
```
≥180 or ≥120 → "Danger" (rose) - Emergency
≥140 or ≥90  → "High" (rose) - Monitor closely
<90 or <60   → "Low" (amber) - Check for symptoms
≥120 or ≥80  → "Elevated" (amber) - Continue monitoring
Otherwise    → "Normal" (emerald)
```

---

### 5. MedicineImage (Medicine Upload)

**Purpose**: Store uploaded medicine photos

**Fields**:
```typescript
id: String @id @default(cuid())              // Image ID
elderlyId: String                            // Patient ID
imageUrl: String                             // Vercel Blob URL
label: String?                               // OCR extracted label (memo)
uploadedById: String?                        // Who uploaded it
uploadedAt: DateTime @default(now())         // Upload time
```

**Relationships**:
- `elderly`: ElderlyProfile
- `uploadedBy`: User
- `aiScans`: AiScan[] - Analysis results

**Data Flow**:
```
User uploads image 
  → MedicineImage record created 
  → AiScan initiated (PENDING)
  → Tesseract OCR processes
  → AiScan status → COMPLETED (with extractedText + confidence)
```

---

### 6. AiScan (AI Analysis)

**Purpose**: Store AI/OCR analysis results

**Fields**:
```typescript
id: String @id @default(cuid())              // Scan ID
elderlyId: String                            // Patient ID
medicineImageId: String?                     // Links to medicine photo
scanType: AiScanType                        // MEDICINE_IMAGE | BLOOD_PRESSURE_IMAGE
imageUrl: String                             // Image being analyzed
extractedText: String?                       // OCR result text
status: AiScanStatus @default(PENDING)      // PENDING | COMPLETED | FAILED | REVIEWED
rawResult: Json?                             // Full Tesseract JSON output
summary: String?                             // Human-readable summary
confidence: Float?                           // 0-100 confidence score
reviewedById: String?                        // Doctor review by user
reviewedAt: DateTime?                        // When reviewed
createdAt: DateTime @default(now())         // Scan creation
```

**Status Lifecycle**:
```
PENDING → COMPLETED → REVIEWED (optional)
   ↓
 FAILED (if OCR error)
```

**Relationships**:
- `elderly`: ElderlyProfile
- `medicineImage`: MedicineImage
- `reviewedBy`: User (doctor verification)

---

### 7. ChatMessage (Case Communication)

**Purpose**: Store messages between elderly and doctor

**Fields**:
```typescript
id: String @id @default(cuid())              // Message ID
elderlyId: String                            // Patient ID
senderId: String                             // User who sent message
senderRole: Role                             // Sender's role for quick access
content: String                              // Message text
createdAt: DateTime @default(now())          // Send time
```

**Sender Roles**:
- ELDERLY: Patient message
- DOCTOR: Doctor message
- ADMIN: System admin message

**Relationships**:
- `elderly`: ElderlyProfile
- `sender`: User

---

### 8. AiHealthMessage (AI Chat)

**Purpose**: Conversation history with health AI assistant

**Fields**:
```typescript
id: String @id @default(cuid())              // Message ID
elderlyId: String                            // Patient ID
role: AiHealthMessageRole                   // USER | ASSISTANT
content: String                              // Message content
createdAt: DateTime @default(now())          // Timestamp
```

**Context Used by Claude**:
- Patient name, allergies, chronic diseases
- Latest blood pressure reading
- Latest medicine label
- Latest AI summary
- Assigned doctor names
- Case status

**Relationships**:
- `elderly`: ElderlyProfile

---

### 9. Appointment (Doctor Visit Scheduling)

**Purpose**: Track scheduled doctor appointments

**Fields**:
```typescript
id: String @id @default(cuid())              // Appointment ID
elderlyId: String                            // Patient ID
doctorId: String                             // Doctor ID
appointmentDate: DateTime                    // Scheduled date/time
notes: String?                               // Appointment notes
status: AppointmentStatus @default(SCHEDULED) // SCHEDULED | COMPLETED | CANCELLED | RESCHEDULED
reminderSentAt: DateTime?                    // Reminder notification time
appointmentCompletedAt: DateTime?            // Completion time
createdAt: DateTime @default(now())          // Booking time
updatedAt: DateTime @updatedAt               // Last update

@@index([elderlyId])
@@index([doctorId])
@@index([appointmentDate])
```

**Status Values**:
- **SCHEDULED**: Confirmed appointment pending
- **COMPLETED**: Doctor visit completed
- **CANCELLED**: Appointment cancelled
- **RESCHEDULED**: Moved to different date

**Relationships**:
- `elderly`: ElderlyProfile
- `doctor`: User
- `rescheduleHistory`: AppointmentReschedule[]
- `appointmentHistory`: AppointmentHistory[]

---

### 10. AppointmentReschedule (Reschedule Tracking)

**Purpose**: Track appointment changes with reasons

**Fields**:
```typescript
id: String @id @default(cuid())              // Reschedule ID
appointmentId: String                        // Original appointment
originalDate: DateTime                       // Original scheduled date
newDate: DateTime                            // New scheduled date
reason: RescheduleReason                     // DOCTOR_UNAVAILABLE | DOCTOR_EMERGENCY | 
                                             // ELDERLY_REQUEST | ADMIN_REQUEST | OTHER
reasonDetail: String?                        // Additional explanation
rescheduledBy: String                        // User ID who rescheduled
rescheduledAt: DateTime @default(now())      // Reschedule time
createdAt: DateTime @default(now())          // Record creation
```

**Reasons**:
- DOCTOR_UNAVAILABLE: Doctor scheduling conflict
- DOCTOR_EMERGENCY: Urgent medical emergency
- ELDERLY_REQUEST: Patient requested change
- ADMIN_REQUEST: Admin initiated change
- OTHER: Other reason

**Relationships**:
- `appointment`: Appointment
- `rescheduledByUser`: User

---

### 11. AppointmentHistory (Audit Trail)

**Purpose**: Historical record of all appointments

**Fields**:
```typescript
id: String @id @default(cuid())              // History ID
appointmentId: String                        // Reference appointment
elderlyId: String                            // Patient ID
doctorId: String                             // Doctor ID
appointmentDate: DateTime                    // When scheduled
notes: String?                               // Appointment notes
status: AppointmentStatus                    // Final status
completedAt: DateTime?                       // Completion time
createdAt: DateTime @default(now())          // Record time

@@index([elderlyId])
@@index([doctorId])
```

**Relationships**:
- `appointment`: Appointment
- `elderly`: ElderlyProfile
- `doctor`: User

---

### 12. AuditLog (Activity Tracking)

**Purpose**: Log all system actions for compliance

**Fields**:
```typescript
id: String @id @default(cuid())              // Log ID
userId: String?                              // Who performed action
action: String                               // Action type (e.g., "CASE_CLOSED")
entityType: String                           // Entity type (e.g., "ELDERLY", "APPOINTMENT")
entityId: String                             // Entity ID affected
meta: Json?                                  // Additional details
createdAt: DateTime @default(now())          // Log timestamp
```

**Example**:
```json
{
  "action": "CASE_CLOSED",
  "entityType": "DOCTOR_PATIENT",
  "entityId": "case123",
  "meta": {
    "doctorId": "doc456",
    "elderlyId": "elderly789",
    "closedNote": "Recovered"
  }
}
```

**Relationships**:
- `user`: User (can be null if system action)

---

### 13. NextAuth Tables

**Account** (OAuth accounts)
```typescript
id, userId, type, provider, providerAccountId, 
refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
```

**Session** (JWT sessions)
```typescript
id, sessionToken, userId, expires
```

**VerificationToken** (Email verification)
```typescript
identifier, token, expires
```

---

## Enums

### Role
```typescript
ADMIN      // System administrator
DOCTOR     // Healthcare provider
CAREGIVER  // Caregiver/family member
ELDERLY    // Elderly patient (primary user)
```

### Gender
```typescript
MALE       // Male
FEMALE     // Female
OTHER      // Other/Prefer not to say
```

### CaseStatus (Elderly)
```typescript
SELF_SERVICE    // Not consulting doctor
WAITING_DOCTOR  // Awaiting doctor acceptance
IN_REVIEW       // Doctor actively managing
COMPLETED       // Case closed
```

### DoctorCaseStatus (Doctor-Patient)
```typescript
ACTIVE      // Ongoing relationship
COMPLETED   // Case closed
```

### AiScanType
```typescript
MEDICINE_IMAGE       // Medicine label OCR
BLOOD_PRESSURE_IMAGE // BP reading OCR
```

### AiScanStatus
```typescript
PENDING     // Awaiting processing
COMPLETED   // Processing finished, results available
FAILED      // OCR processing error
REVIEWED    // Doctor verified/reviewed
```

### AppointmentStatus
```typescript
SCHEDULED   // Confirmed, pending
COMPLETED   // Visit completed
CANCELLED   // Cancelled by user
RESCHEDULED // Moved to new date
```

### RescheduleReason
```typescript
DOCTOR_UNAVAILABLE   // Doctor cannot attend
DOCTOR_EMERGENCY     // Medical emergency
ELDERLY_REQUEST      // Patient requested
ADMIN_REQUEST        // Admin initiated
OTHER                // Other reason
```

### AiHealthMessageRole
```typescript
USER       // Patient message
ASSISTANT  // AI response
```

---

## Indexes

**Performance-critical indexes**:
```typescript
Appointment:
  @@index([elderlyId])       // Queries by patient
  @@index([doctorId])        // Queries by doctor
  @@index([appointmentDate]) // Queries by date

AppointmentHistory:
  @@index([elderlyId])       // Patient appointment history
  @@index([doctorId])        // Doctor appointment history

DoctorPatient:
  @@unique([doctorId, elderlyId])  // Enforce one case per pair
```

---

## Data Constraints

1. **One ElderlyProfile per User**: `elderlyUserId` is unique
2. **One DoctorPatient per Pair**: `[doctorId, elderlyId]` is unique
3. **Unique Email**: Users have unique email addresses
4. **Cascading Deletes**: 
   - Deleting elderly profile cascades to all their records
   - Deleting appointment cascades to history
5. **Reference Integrity**:
   - Foreign keys enforce relationships
   - SetNull for optional relationships (can be deleted)
   - Cascade for owned relationships

---

## Common Queries

### Get Patient with Full Profile
```prisma
prisma.elderlyProfile.findUnique({
  where: { id: patientId },
  include: {
    elderlyUser: true,
    bloodPressures: { take: 24, orderBy: { measuredAt: 'desc' } },
    medicineImages: { take: 24, orderBy: { uploadedAt: 'desc' } },
    aiScans: { take: 24, orderBy: { createdAt: 'desc' } },
    doctors: { where: { status: 'ACTIVE' } },
    chatMessages: { orderBy: { createdAt: 'asc' }, take: 40 }
  }
})
```

### Get Doctor's Assigned Patients
```prisma
prisma.doctorPatient.findMany({
  where: { doctorId, status: 'ACTIVE' },
  include: { elderly: true }
})
```

### Get Active Cases for Patient
```prisma
prisma.doctorPatient.findMany({
  where: { elderlyId, status: 'ACTIVE' },
  include: {
    doctor: { select: { id: true, name: true, email: true } }
  }
})
```

### Get Upcoming Appointments
```prisma
prisma.appointment.findMany({
  where: {
    doctorId,
    appointmentDate: { gte: new Date() },
    status: { not: 'CANCELLED' }
  },
  include: { elderly: true }
})
```

---

## Migration & Setup

### Initialize Schema
```bash
npx prisma migrate dev --name init
```

### Generate Prisma Client
```bash
npm run db:generate
```

### Push Schema (No Migrations)
```bash
npm run db:push
```

### View Data (Prisma Studio)
```bash
npm run db:studio
```

---

**Last Updated**: April 2026
**Database**: PostgreSQL 16+
**ORM**: Prisma 7.6.0
