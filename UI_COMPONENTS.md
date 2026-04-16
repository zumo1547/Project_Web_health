# UI Components & Frontend Architecture

## Component Hierarchy

```
src/components/
├── admin/                              # Admin-specific components
│   ├── admin-user-management.tsx      # User CRUD interface
│   ├── admin-case-assignment.tsx      # Doctor-patient assignment
│   ├── admin-profile-management.tsx   # Profile editing
│   └── admin-appointment-management.tsx # Appointment oversight
│
├── auth/                               # Authentication components
│   └── auth-showcase.tsx              # Auth UI elements
│
├── dashboard/                          # Shared dashboard components
│   ├── app-shell.tsx                  # Layout wrapper (sidebar/nav)
│   ├── summary-card.tsx               # Stat display (BP, counts)
│   ├── doctor-appointment-list.tsx    # Doctor's appointment view
│   ├── doctor-case-action-button.tsx  # Case management buttons
│   ├── elderly-appointment-history.tsx # Appointment history
│   ├── elderly-table.tsx              # Patient list table
│   └── quick-action-card.tsx          # Action shortcuts
│
├── elderly/                            # Elderly user components
│   └── health-records-tabs.tsx        # Interactive BP/Medicine/AI tabs
│
├── forms/                              # Form components (primary UI)
│   ├── login-form.tsx                 # Authentication form
│   ├── elderly-form.tsx               # Elderly profile form
│   ├── blood-pressure-form.tsx        # BP entry form
│   ├── ai-scan-form.tsx               # Image scan interface
│   ├── chat-panel.tsx                 # Doctor-elderly chat
│   ├── ai-health-chat-panel.tsx       # AI health assistant chat
│   ├── doctor-appointment-form.tsx    # Schedule appointment
│   ├── doctor-hospital-share-panel.tsx # Hospital carousel
│   ├── appointment-chat-integration.tsx # Appointment + chat
│   ├── elderly-profile-settings-form.tsx # Profile edit
│   ├── image-source-picker.tsx        # Camera/upload picker
│   ├── case-request-panel.tsx         # Request doctor case
│   ├── record-delete-button.tsx       # Confirm delete action
│   └── ...additional forms
│
├── providers/                          # Context providers
│   └── ...providers.tsx               # React Context wrappers
│
└── ui/                                 # Reusable UI elements
    ├── badge.tsx                      # Status/tag display
    ├── button.tsx                     # Styled buttons
    ├── card.tsx                       # Card containers
    ├── input.tsx                      # Text input
    ├── select.tsx                     # Dropdown select
    ├── tabs.tsx                       # Tab interface
    ├── dialog.tsx                     # Modal dialogs
    ├── alert.tsx                      # Alert messages
    ├── loading.tsx                    # Spinners/loaders
    └── ...more UI
```

---

## Key Component Details

### Summary Card (`components/dashboard/summary-card.tsx`)
**Purpose**: Display health statistics overview
**Props**:
```typescript
{
  label: string              // "ความดัน" "ยา" etc.
  value: string | number     // Main statistic
  unit?: string             // "mmHg", "คน", etc.
  assessment?: {
    tone: "emerald" | "amber" | "rose" | "slate"
    shortLabel: string      // "ปกติ" "สูง" etc.
  }
  action?: {
    label: string
    href: string
  }
}
```

**Display**:
```
┌─────────────────────────┐
│ ความดัน                  │
│ 138/88 mmHg             │
│ [ค่อนข้างสูง] 📊        │
│ [ดูประวัติ →]           │
└─────────────────────────┘
```

---

### Health Records Tabs (`components/elderly/health-records-tabs.tsx`)
**Purpose**: Interactive tabbed interface for health records
**Props**:
```typescript
{
  elderlyId: string
  bloodPressures: BloodPressureRecord[]
  medicineImages: MedicineImage[]
  aiScans: AiScan[]
  canDeleteUploads: boolean
}
```

**Tabs**:
1. **Blood Pressure** (`blood-pressure`)
   - Displays latest 24 BP records
   - Shows: Systolic/Diastolic, Pulse, Measured time, Assessment color
   - Actions: Delete button (if permitted)
   - Max height: 600px with scrolling

2. **Medicines** (`medicines`)
   - Shows medicine images uploaded
   - Displays: Image thumbnail, upload time, label text
   - Actions: Delete, view full image
   - OCR confidence score if available

3. **AI Scans** (`ai-scans`)
   - AI analysis results from images
   - Shows: Type (medicine/BP), extracted text, confidence %
   - Status badges: PENDING, COMPLETED, FAILED, REVIEWED
   - Doctor review notes

**Styling**:
```
Active Tab:    bg-emerald-50 text-emerald-700 border-emerald-200
Inactive Tab:  bg-slate-100 text-slate-600
Content Area:  max-h-[600px] overflow-y-auto
Action Btn:    gradient from-amber-100 to-yellow-100
                hover:shadow-md transition-all
```

---

### Chat Panel (`components/forms/chat-panel.tsx`)
**Purpose**: Real-time messaging between doctor and elderly
**Props**:
```typescript
{
  elderlyId: string
  currentUserId: string
  currentUserRole: Role
  initialMessages: ChatMessage[]
  onNewMessage?: (message: ChatMessage) => void
}
```

**Features**:
- Message history scrollable view
- User messages: right-aligned, blue background
- Doctor/AI messages: left-aligned, gray background
- Input field with send button
- Auto-scroll to newest message
- Loading indicator while sending

**Message Layout**:
```
┌──────────────────────────────────────┐
│ [Old message...]                     │
│                                      │
│                    [User message]    │
│ [Doctor response]                    │
│                                      │
│ ┌──────────────────────────────┐    │
│ │ Type message...           [Send] │
│ └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

---

### Hospital Share Panel (`components/forms/doctor-hospital-share-panel.tsx`)
**Purpose**: Display nearby hospitals in scrollable carousel
**Props**:
```typescript
{
  elderlyProfile: ElderlyProfile
  onShare?: (hospital: Hospital) => void
}
```

**Layout**: Horizontal scrollable carousel
```
┌────────────────────────────────────┐
│ [Hospital 1]  [Hospital 2] → [>]  │
│  • Name                            │
│  • 2.3 km away                     │
│  • [แผนที่] [ส่งเข้าแชท]          │
│                                    │
│ [Card width: min-w-[300px]]        │
│ [Scrollable: overflow-x-auto]      │
└────────────────────────────────────┘
```

**Card Features**:
- Hospital name (bold)
- Distance badge (rose-50 bg)
- "เปิดแผนที่" button - Opens Google Maps
- "ส่งเข้าแชท" button - Shares hospital info to chat

---

### Blood Pressure Form (`components/forms/blood-pressure-form.tsx`)
**Purpose**: Record blood pressure manually or from image
**Modes**:
1. **Manual Entry**
   - Systolic input (0-300)
   - Diastolic input (0-300)
   - Pulse input (optional)
   - Time picker

2. **Image Scan**
   - Upload/camera picker
   - OCR processing
   - Auto-extraction of values
   - Manual correction option

**Validation**:
- Systolic >= Diastolic (usually)
- Values in reasonable ranges
- Time not in future

**Response**:
```typescript
{
  systolic: number
  diastolic: number
  pulse?: number
  measuredAt: Date
  sourceImageUrl?: string
}
```

---

### AI Health Chat Panel (`components/forms/ai-health-chat-panel.tsx`)
**Purpose**: Chat with AI assistant about health
**Features**:
- Message history with AI
- Context-aware responses
- Markdown formatting
- Copy response button
- Regenerate response

**Context Data**:
- Patient name, age, gender
- Blood pressure (latest)
- Medicines (latest)
- Chronic diseases
- Allergies
- Case status

---

### Doctor Appointment Form (`components/forms/doctor-appointment-form.tsx`)
**Purpose**: Schedule appointments with patients
**Props**:
```typescript
{
  elderlyProfile: ElderlyProfile
  doctorId: string
}
```

**Form Fields**:
- Date picker (future dates only)
- Time picker (business hours)
- Notes (optional)
- Reminder time selection

**Validations**:
- Date cannot be in past
- Time available for doctor
- Patient not already booked

---

### Image Source Picker (`components/forms/image-source-picker.tsx`)
**Purpose**: Choose between camera or file upload
**Options**:
1. **Camera** - Real-time capture on mobile
2. **Gallery** - Upload existing image
3. **File Upload** - Desktop file selection

**Supported Formats**:
- JPEG (Recommended for medicine labels)
- PNG (Good for screenshots)
- WebP (Modern format)

**Processing**:
```
User selects image
  ↓
Client-side validation (type, size)
  ↓
Image compression (if needed)
  ↓
Upload to server
  ↓
Save to Vercel Blob
  ↓
Queue OCR processing
```

---

### Case Request Panel (`components/forms/case-request-panel.tsx`)
**Purpose**: Elderly user requests doctor consultation
**Features**:
- Message to attach to request
- Reason dropdown (symptom type)
- Status display (waiting, accepted, in-review)
- Message history with doctor
- Close case button (when done)

**Status Flow**:
```
SELF_SERVICE → WAITING_DOCTOR → IN_REVIEW → COMPLETED
[Request]         [Waiting]      [Doctor]    [Closed]
```

---

### Elderly Profile Settings Form (`components/forms/elderly-profile-settings-form.tsx`)
**Purpose**: Edit elderly user profile information
**Fields**:
- First name, last name
- Birth date
- Phone number
- Address
- Gender
- Chronic diseases (textarea)
- Allergies (textarea)
- Notes (textarea)

**Validations**:
- Name: Required, 1-100 chars
- Phone: Optional, Thai format
- Date: Valid past date
- Address: Optional, no sensitive info

---

### Record Delete Button (`components/forms/record-delete-button.tsx`)
**Purpose**: Safely delete health records with confirmation
**Features**:
- Confirmation dialog before delete
- Record preview before deletion
- Undo option (if applicable)
- Audit logging

**Dialog**:
```
┌─────────────────────────────┐
│ ⚠️ ลบข้อมูลนี้?              │
│                             │
│ วันที่ ... ความดัน 138/88   │
│                             │
│ [ยกเลิก] [ลบเลย]           │
└─────────────────────────────┘
```

---

## Page Layouts

### Home Page (`src/app/page.tsx`)
**Layout**: Hero section + feature cards
```
┌──────────────────────────────────────┐
│ [Brand] [Nav links] [Login/Register] │
├──────────────────────────────────────┤
│                                      │
│  ตรวจสุขภาพประจำวัน                │
│  สำหรับผู้สูงอายุ                   │
│                                      │
│  [เริ่มตรวจสุขภาพ] [สมัครผู้สูงอายุ]│
│                                      │
│  ┌─────────────────────────────┐   │
│  │ [Feature 1]  [Feature 2]    │   │
│  │ [Feature 3]  [Feature 4]    │   │
│  └─────────────────────────────┘   │
└──────────────────────────────────────┘
```

---

### Login/Register Pages
**Layout**: Form centered, background
```
┌──────────────────────────┐
│                          │
│      [Logo]              │
│      เข้าสู่ระบบ          │
│                          │
│  ┌────────────────────┐ │
│  │ Email ...          │ │
│  │ Password ...       │ │
│  │ [เข้าสู่ระบบ]       │ │
│  │ [ลืมรหัสผ่าน?]     │ │
│  └────────────────────┘ │
│                          │
│  ยังไม่มีบัญชี?          │
│  [สมัครบัญชีใหม่]       │
│                          │
└──────────────────────────┘
```

---

### Elderly Portal (`src/app/elderly-portal/page.tsx`)
**Layout**: 2-column dashboard
```
┌──────────────────────────────────────────┐
│ [Header: Elderly name, Date]             │
├──────────────────────────────────────────┤
│                                          │
│ [Summary cards] (BP, medicines, etc.)   │
│                                          │
│ ┌─────────────────┬────────────────────┐ │
│ │ Health Records  │ AI Health Chat     │ │
│ │ • BP History    │                    │ │
│ │ • Medicines     │ [Chat messages]    │ │
│ │ • AI Scans      │                    │ │
│ │                 │ [Input...]         │ │
│ ├─────────────────┤────────────────────┤ │
│ │ Case Request    │ Appointments       │ │
│ │ Status: ...     │ • Date 1           │ │
│ │ [Message...]    │ • Date 2           │ │
│ │ [Send]          │                    │ │
│ └─────────────────┴────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

---

### Doctor Portal - Patient List (`src/app/doctor/page.tsx`)
**Layout**: Table with patients
```
┌────────────────────────────────────────┐
│ [Search] [Filter by status]            │
├────────────────────────────────────────┤
│ Name         Age BP      Status  Action │
│ John Doe     72  138/88  Active  [View]│
│ Jane Smith   65  120/80  Waiting [View]│
│ ...                                    │
└────────────────────────────────────────┘
```

---

### Doctor Portal - Patient Profile (`src/app/elderly/[id]/page.tsx`)
**Layout**: 3-column profile view (xl+ screens)
```
┌─────────────────────────────────────────────────┐
│ [Header: Patient name, Age, Gender]            │
├──────────────┬──────────────┬──────────────────┤
│              │              │                  │
│  Col 1       │   Col 2      │     Col 3        │
│  ┌────────┐  │ ┌──────────┐ │ ┌──────────────┐ │
│  │Profile │  │ │   Chat   │ │ │ Appointments │ │
│  │Info    │  │ │ Messages │ │ │              │ │
│  ├────────┤  │ │          │ │ │ ┌──────────┐ │ │
│  │Health  │  │ │ [Scroll] │ │ │ │Hospital  │ │ │
│  │Records │  │ │          │ │ │ │Carousel  │ │ │
│  │Tabs:   │  │ │ [Input]  │ │ │ └──────────┘ │ │
│  │• BP    │  │ └──────────┘ │ │              │ │
│  │• Meds  │  │              │ │ Contact Info │ │
│  │• Scans │  │              │ │              │ │
│  │        │  │              │ │ Health Alerts│ │
│  └────────┘  │              │ │              │ │
│              │              │ └──────────────┘ │
└──────────────┴──────────────┴──────────────────┘
```

**Responsive**:
- **XL (1280px+)**: 3-column layout
- **LG (1024px)**: 2-column + stacked
- **MD (768px)**: Single column stack
- **SM (640px)**: Mobile optimized

---

### Admin Portal (`src/app/admin/page.tsx`)
**Layout**: Dashboard with admin tools
```
┌──────────────────────────────────────────┐
│ [Admin name] [Navigation tabs]           │
├──────────────────────────────────────────┤
│                                          │
│ Tab: Users | Cases | Appointments | Log │
│                                          │
│ [Content area for selected tab]          │
│                                          │
│ • User Management Table                  │
│ • Case Assignment Interface              │
│ • Appointment Oversight                  │
│ • Audit Log Viewer                       │
│                                          │
└──────────────────────────────────────────┘
```

---

## UI Styling System

### Color Palette (Tailwind)
```typescript
Assessment Tones:
  emerald  - Normal (BP 90-119 mmHg)
  amber    - Caution (BP 120-139 or <90)
  rose     - Warning (BP ≥140)
  slate    - Neutral/Unknown

Status Colors:
  emerald  - Active, Good
  amber    - Pending, Caution
  rose     - Critical, Warning
  slate    - Inactive, Unknown
```

### Typography
```
Headings:
  h1: text-4xl font-black (Home hero)
  h2: text-3xl font-bold (Section titles)
  h3: text-2xl font-bold (Card titles)
  h4: text-lg font-bold (Form labels)

Body:
  Base: text-base (16px) leading-6
  Small: text-sm (14px) leading-5
  Caption: text-xs (12px) - timestamps

Buttons:
  Large: px-8 py-3 text-base
  Medium: px-4 py-2 text-sm
  Small: px-3 py-1 text-xs
```

### Spacing
```
Sections: mb-8 gap-8
Cards: p-6
Form fields: mb-4
Buttons: gap-3
List items: py-3 border-b
```

### Shadows
```
Card default: shadow-sm
Elevated: shadow-md
Highlighted: shadow-lg
Active/Hover: shadow-md (smooth transition)
```

---

## State Management

### React Hooks
```typescript
// Local component state
const [activeTab, setActiveTab] = useState("blood-pressure")

// Form state (React Hook Form)
const form = useForm<BloodPressureInput>({...})
const { handleSubmit, watch, formState } = form

// Chat input
const [message, setMessage] = useState("")

// Loading states
const [loading, setLoading] = useState(false)
```

### API Data Fetching (React Query)
```typescript
// Patient profile data
const { data: elderly, isLoading } = useQuery({
  queryKey: ["elderly", id],
  queryFn: () => fetchElderly(id),
  staleTime: 5 * 60 * 1000  // 5 minutes
})

// Appointments
const { data: appointments } = useQuery({
  queryKey: ["appointments", userId],
  queryFn: () => fetchAppointments(userId)
})
```

---

## Accessibility Features

### WCAG 2.1 Compliance
- Large text (16px+ for body)
- High contrast colors (≥4.5:1)
- Clear button labels
- Form labels linked to inputs
- Keyboard navigation support
- Focus indicators visible
- ARIA labels for icons

### Mobile-First Design
- Touch-friendly buttons (min 44x44px)
- Large form inputs
- Readable font sizes
- Vertical scrolling priority
- No hover-only interactions

---

## Performance Optimizations

### Component Splitting
- Lazy loading with `React.lazy()`
- Code splitting at page boundaries
- Dynamic imports for heavy features

### Image Optimization
- Next.js `Image` component
- Sharp compression on server
- Responsive `srcSet`
- Blur placeholders for thumbnails

### Rendering Optimizations
- React 19 concurrent features
- Babel React Compiler enabled
- Memoization of expensive components
- Proper key usage in lists

---

## Form Handling

### React Hook Form + Zod
```typescript
// Define validation schema
const bloodPressureSchema = z.object({
  systolic: z.number().min(0).max(300),
  diastolic: z.number().min(0).max(300),
  measuredAt: z.date()
})

// Use in component
const form = useForm<z.infer<typeof bloodPressureSchema>>({
  resolver: zodResolver(bloodPressureSchema)
})
```

---

**Last Updated**: April 2026
**React Version**: 19.2.4
**Styling**: Tailwind CSS 4
**Responsive**: Mobile-first
