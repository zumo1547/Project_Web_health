# API Routes & Architecture Documentation

## API Routes Overview

```
/api/
├── auth/                          # NextAuth authentication handlers
├── elderly/                       # Elderly user endpoints
│   ├── [id]/                      # Patient-specific endpoints
│   │   ├── blood-pressure/        # BP record management
│   │   ├── medicine-images/       # Medicine photo upload
│   │   ├── ai-scans/             # AI analysis endpoints
│   │   └── chat-messages/         # Chat messaging
│   └── health-summary/            # AI health summary generation
├── appointments/                  # Appointment management
│   ├── [id]/                      # Appointment-specific endpoints
│   ├── reschedule/                # Reschedule handling
│   └── history/                   # Historical records
├── admin/                         # Admin-only endpoints
│   ├── users/                     # User management
│   ├── cases/                     # Case assignment
│   ├── audit-logs/                # Activity logs
│   └── statistics/                # System statistics
└── register/                      # New user registration
```

---

## Authentication Routes (`/api/auth`)

### NextAuth Handlers
**Route**: `/api/auth/[...nextauth]`

**Providers**:
1. **Credentials Provider** - Email + password
   - Email validation
   - Bcrypt password hashing/verification
   - Custom role-based logic

2. **Google OAuth** - Social login (if configured)
   - Environment: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - Auto-creates user on first sign-in

3. **Facebook OAuth** - Social login (if configured)
   - Environment: `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET`
   - Auto-creates user on first sign-in

**Key Callbacks**:
```typescript
async function syncOAuthElderlyUser(userId, email)
  - Enforces ELDERLY role for OAuth sign-ins
  - Initializes elderly profile if missing
  - Sets onboarding requirements
  
async function authorize(credentials)
  - Validates email + password
  - Checks user exists and role is permitted
  - Returns user or null
```

**Session Strategy**: JWT (no database session lookup on every request)

---

## Elderly User Endpoints (`/api/elderly`)

### GET `/api/elderly/[id]`
**Purpose**: Fetch elderly user profile with health data
**Authentication**: Required
**Authorization**: Own profile, or Doctor/Admin
**Response**:
```typescript
{
  id: string
  firstName: string
  lastName: string
  birthDate: Date
  phone: string
  allergies: string
  chronicDiseases: string
  caseStatus: CaseStatus
  bloodPressures: BloodPressureRecord[]  // Latest 24
  medicineImages: MedicineImage[]         // Latest 24
  aiScans: AiScan[]                       // Latest 24
  doctors: { doctor: { id, name, email } }[] // Active cases
  chatMessages: ChatMessage[]             // Last 40
  _count: {
    bloodPressures: number
    medicineImages: number
    aiScans: number
    chatMessages: number
    aiHealthMessages: number
  }
}
```

### POST `/api/elderly/[id]/blood-pressure`
**Purpose**: Create blood pressure record
**Authentication**: Required
**Authorization**: Own record, or Doctor/Admin
**Request Body**:
```typescript
{
  systolic: number          // 0-300
  diastolic: number         // 0-300
  pulse?: number           // Optional heart rate
  measuredAt: ISO8601Date  // Measurement time
  note?: string            // Optional note
  sourceImageUrl?: string  // If scanned from image
}
```
**Response**: `BloodPressureRecord`

### GET `/api/elderly/[id]/blood-pressure`
**Purpose**: Get blood pressure history
**Query Parameters**:
- `limit?`: number (default: 24)
- `offset?`: number (default: 0)

**Response**: `BloodPressureRecord[]`

### DELETE `/api/elderly/[id]/blood-pressure/[recordId]`
**Purpose**: Remove blood pressure record
**Authorization**: Own record, or Doctor/Admin
**Response**: `{ success: boolean }`

---

## Medicine Image Upload (`/api/elderly/[id]/medicine-images`)

### POST `/api/elderly/[id]/medicine-images`
**Purpose**: Upload medicine photo and initiate AI analysis
**Authentication**: Required
**Authorization**: Own upload, or Doctor/Admin
**Request Body** (Multipart Form):
```typescript
file: File                 // Image file (JPEG/PNG)
label?: string            // Optional manual label
```

**Process**:
1. Upload image to Vercel Blob
2. Create `MedicineImage` record
3. Create `AiScan` record with status PENDING
4. Queue Tesseract OCR processing
5. Update AiScan with results when complete

**Response**:
```typescript
{
  medicineImage: MedicineImage
  aiScan: AiScan { status: "PENDING" }
}
```

### GET `/api/elderly/[id]/medicine-images`
**Purpose**: Get medicine image history
**Response**: `MedicineImage[]`

### DELETE `/api/elderly/[id]/medicine-images/[imageId]`
**Purpose**: Remove medicine image and related scans
**Response**: `{ success: boolean }`

---

## AI Scan Results (`/api/elderly/[id]/ai-scans`)

### GET `/api/elderly/[id]/ai-scans`
**Purpose**: Get AI analysis results
**Query Parameters**:
- `limit?`: number
- `offset?`: number
- `status?`: "PENDING" | "COMPLETED" | "FAILED" | "REVIEWED"

**Response**: `AiScan[]` with extracted text and confidence scores

### POST `/api/elderly/[id]/ai-scans/[scanId]/review`
**Purpose**: Doctor reviews/validates OCR result
**Authentication**: Required
**Authorization**: Doctor or Admin only

**Request Body**:
```typescript
{
  verified: boolean        // Doctor verified the extraction
  correctedText?: string  // Manual correction if wrong
  notes?: string          // Additional notes
}
```

**Response**: `AiScan { status: "REVIEWED" }`

---

## Chat Messages (`/api/elderly/[id]/chat-messages`)

### POST `/api/elderly/[id]/chat-messages`
**Purpose**: Send message between doctor and elderly
**Authentication**: Required
**Authorization**: Participant in conversation
**Request Body**:
```typescript
{
  content: string         // Message text
}
```

**Response**:
```typescript
{
  id: string
  content: string
  sender: { id, name, role }
  createdAt: Date
}
```

### GET `/api/elderly/[id]/chat-messages`
**Purpose**: Get chat history
**Query Parameters**:
- `limit?`: number (default: 40)
- `offset?`: number

**Response**: `ChatMessage[]` (oldest first)

---

## Health Summary (`/api/elderly/[id]/health-summary`)

### POST `/api/elderly/[id]/health-summary`
**Purpose**: Generate AI health summary via Claude
**Authentication**: Required
**Authorization**: Own record, or Doctor
**Request Body**:
```typescript
{
  userMessage: string     // Question/concern about health
  context?: {
    bloodPressure?: boolean  // Include BP in context
    medicines?: boolean      // Include medicine info
    history?: boolean        // Include chat history
  }
}
```

**Process**:
1. Build context from:
   - Patient name, age, gender
   - Chronic diseases & allergies
   - Latest blood pressure + assessment
   - Latest medicine label
   - Latest AI summary
   - Assigned doctor names
   - Recent case status

2. Send to Claude API with:
   - System prompt (health guidance in Thai)
   - Patient context
   - User message

3. Stream or return response

**Response**:
```typescript
{
  summary: string         // Markdown formatted Thai response
  sources: string[]       // Data sources used
  confidence: "HIGH" | "MEDIUM" | "LOW"
}
```

---

## Appointment Endpoints (`/api/appointments`)

### GET `/api/appointments`
**Purpose**: List appointments
**Query Parameters**:
- `doctorId?`: string - Filter by doctor
- `elderlyId?`: string - Filter by patient
- `status?`: AppointmentStatus - Filter by status
- `fromDate?`: ISO8601 - Filter from date
- `toDate?`: ISO8601 - Filter to date

**Response**: `Appointment[]`

### POST `/api/appointments`
**Purpose**: Create new appointment
**Authentication**: Required
**Authorization**: Doctor or Admin
**Request Body**:
```typescript
{
  doctorId: string
  elderlyId: string
  appointmentDate: ISO8601Date
  notes?: string
}
```

**Process**:
1. Validate doctor-patient relationship exists
2. Check time slot availability
3. Create Appointment record
4. Queue SMS reminder (24 hours before)

**Response**: `Appointment`

### GET `/api/appointments/[id]`
**Purpose**: Get appointment details
**Response**: `Appointment` with reschedule history

### PATCH `/api/appointments/[id]`
**Purpose**: Update appointment (notes, status)
**Request Body**:
```typescript
{
  notes?: string
  status?: AppointmentStatus
  appointmentCompletedAt?: ISO8601Date
}
```

**Response**: `Appointment`

### POST `/api/appointments/[id]/reschedule`
**Purpose**: Reschedule appointment
**Authentication**: Required
**Authorization**: Doctor, patient, or Admin

**Request Body**:
```typescript
{
  newDate: ISO8601Date
  reason: RescheduleReason
  reasonDetail?: string
}
```

**Process**:
1. Create AppointmentReschedule record
2. Update Appointment.appointmentDate
3. Queue new SMS reminder

**Response**:
```typescript
{
  appointment: Appointment
  reschedule: AppointmentReschedule
}
```

### DELETE `/api/appointments/[id]`
**Purpose**: Cancel appointment
**Authorization**: Doctor or Admin
**Query Parameters**:
- `reason?`: RescheduleReason

**Response**: `{ success: boolean }`

---

## Admin Endpoints (`/api/admin`)

### User Management (`/api/admin/users`)

**GET** `/api/admin/users`
- List all users with filters
- Query: `role`, `email`, `search`, `limit`, `offset`
- Response: `User[]` paginated

**POST** `/api/admin/users`
- Create new user
- Request: `{ email, password, name, role }`
- Response: `User` (with hashed password)

**GET** `/api/admin/users/[id]`
- Get user details
- Response: `User` with profile info

**PATCH** `/api/admin/users/[id]`
- Update user
- Request: `{ name?, role?, email? }`
- Response: `User`

**DELETE** `/api/admin/users/[id]`
- Deactivate user
- Response: `{ success: boolean }`

---

### Case Assignment (`/api/admin/cases`)

**GET** `/api/admin/cases`
- List all active cases
- Filters: `status`, `elderlyId`, `doctorId`
- Response: `DoctorPatient[]` with doctor & elderly info

**POST** `/api/admin/cases`
- Assign doctor to elderly
- Request: `{ doctorId, elderlyId }`
- Process:
  1. Check doctor-patient relationship doesn't exist
  2. Create DoctorPatient record with ACTIVE status
  3. Update elderly.caseStatus to IN_REVIEW
  4. Send notification to doctor

**Response**: `DoctorPatient`

**PATCH** `/api/admin/cases/[caseId]`
- Update case status
- Request: `{ status: DoctorCaseStatus, closedNote? }`
- Response: `DoctorPatient`

**DELETE** `/api/admin/cases/[caseId]`
- Close case
- Response: `{ success: boolean }`

---

### Audit Logs (`/api/admin/audit-logs`)

**GET** `/api/admin/audit-logs`
- List activity logs
- Filters: `action`, `entityType`, `userId`, `dateFrom`, `dateTo`
- Query: `limit`, `offset`
- Response: `AuditLog[]` paginated

**GET** `/api/admin/audit-logs/[id]`
- Get log details with meta information
- Response: `AuditLog` with full JSON meta

---

### Statistics (`/api/admin/statistics`)

**GET** `/api/admin/statistics`
- System overview statistics
- Response:
```typescript
{
  totalUsers: number
  activeElderly: number
  activeDoctors: number
  activeAdmins: number
  activeCases: number
  totalAppointments: number
  completedAppointments: number
  totalBPRecords: number
  totalMedicineImages: number
  userGrowth: { date: Date, count: number }[]
  caseGrowth: { date: Date, count: number }[]
}
```

---

## Registration Endpoint (`/api/register`)

### POST `/api/register`
**Purpose**: New elderly user registration
**Authentication**: Not required (public)
**Request Body**:
```typescript
{
  email: string              // Unique email
  password: string           // Min 8 chars
  name: string              // Display name
  firstName: string         // First name
  lastName: string          // Last name
  birthDate: ISO8601Date    // Date of birth
  phone?: string            // Contact number
  gender?: Gender           // MALE | FEMALE | OTHER
}
```

**Process**:
1. Validate email not already registered
2. Validate password strength
3. Hash password with bcrypt
4. Create User record with ELDERLY role
5. Create ElderlyProfile with onboardingRequired=true
6. Return session token

**Response**:
```typescript
{
  user: { id, email, name, role }
  session: { sessionToken, expires }
}
```

---

## Error Handling

### Standard Error Responses

```typescript
// 400 Bad Request
{
  error: "VALIDATION_ERROR",
  message: "Invalid input data",
  details: { field: "error message" }
}

// 401 Unauthorized
{
  error: "UNAUTHORIZED",
  message: "User not authenticated"
}

// 403 Forbidden
{
  error: "FORBIDDEN",
  message: "User lacks permission for this action"
}

// 404 Not Found
{
  error: "NOT_FOUND",
  message: "Resource does not exist"
}

// 409 Conflict
{
  error: "CONFLICT",
  message: "Resource already exists or relationship invalid"
}

// 500 Internal Server Error
{
  error: "INTERNAL_ERROR",
  message: "Server error processing request"
}
```

---

## Rate Limiting

### Recommended Limits
- Authentication: 5 requests/minute per IP
- API endpoints: 60 requests/minute per user
- Upload: 10 files/minute per user
- Image processing: Queue-based (Tesseract timeout: 8 seconds)

---

## Webhook Integrations

### SMS Appointment Reminders (`/api/appointments/reminders`)
- Scheduled 24 hours before appointment
- Via SMS service (configured in environment)
- Includes: appointment time, doctor name, cancel link

### AI Processing Callbacks
- Tesseract OCR completion
- Updates AiScan.status to COMPLETED
- Triggers any dependent notifications

---

## Middleware & Utilities

### Authentication Middleware
```typescript
// Usage in API routes
const session = await requireSession()  // Throws if no auth
const session = await requireRole([Role.DOCTOR])  // Throws if wrong role
```

### Data Access Control
```typescript
// Verify user can access elderly profile
await assertElderlyReadAccess(elderlyId)
await assertElderlyWriteAccess(elderlyId)
```

### Permission Checks
```typescript
// Check role capabilities
canAccessAdminPortal(role)      // ADMIN only
canAccessDoctorPortal(role)     // DOCTOR | ADMIN
canAccessElderlyPortal(role)    // ELDERLY only
canLoginToPortal(role, portal)  // Portal-specific
```

---

## Caching Strategy

### Client-Side (React Query)
- 5-minute cache for patient profile data
- 10-minute cache for appointment lists
- 30-minute cache for reference data (hospitals, settings)

### Server-Side
- No server-side caching (stateless Vercel)
- Database indexes used for frequently queried fields
- Request deduplication via React Query on client

---

## Pagination

### Standard Pagination
```typescript
GET /api/endpoint?limit=20&offset=0

Response:
{
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

---

## Data Validation

### Zod Schemas (`lib/validations.ts`)
- Email validation (RFC 5321)
- Phone number validation (Thai format support)
- Password strength (min 8 chars, mixed case, number)
- Blood pressure range (0-300 mmHg)
- Date ranges
- Enum validation

---

## File Upload

### Image Upload Process
1. **Client-side**:
   - Validate file type (JPEG/PNG)
   - Validate file size (max 5MB)
   - Compress image via Sharp on server

2. **Server-side**:
   - Save to Vercel Blob
   - Get signed URL for access
   - Create MedicineImage/AiScan record
   - Queue OCR processing

3. **Response**:
```typescript
{
  imageUrl: string          // Vercel Blob URL
  aiScan: {
    id: string
    status: "PENDING"
    confidence: null        // Updated when OCR completes
  }
}
```

---

**Last Updated**: April 2026
**API Version**: v1
**Response Format**: JSON
**Content-Type**: application/json
