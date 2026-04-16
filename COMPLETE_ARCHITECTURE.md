# Complete System Architecture Summary

## Quick Reference Guide

### Project: Elderly Care AI Health Monitoring System
**Purpose**: Comprehensive health tracking for elderly users with doctor oversight
**Built with**: Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma, PostgreSQL
**Status**: Active Development (Last updated: April 2026)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Elderly Care AI System                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Elderly   │  │   Doctor     │  │    Admin     │  │
│  │   Portal    │  │   Portal     │  │    Portal    │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                │                │             │
│  ┌──────┴────────────────┴────────────────┴──────┐    │
│  │        Next.js Frontend (React 19)            │    │
│  │  Pages, Components, Forms, State Management   │    │
│  └──────────────────────┬───────────────────────┘    │
│                         │                             │
│  ┌──────────────────────┴───────────────────────┐    │
│  │   API Layer (Next.js Route Handlers)        │    │
│  │  /api/auth, /api/elderly, /api/appointments │    │
│  │  /api/admin, /api/register                  │    │
│  └──────────────────────┬───────────────────────┘    │
│                         │                             │
│  ┌──────────────────────┴───────────────────────┐    │
│  │   Business Logic Layer (lib/)                │    │
│  │  AI, Case Management, Appointments,          │    │
│  │  Permissions, Health Presenters, Storage    │    │
│  └──────────────────────┬───────────────────────┘    │
│                         │                             │
│  ┌──────────────────────┴───────────────────────┐    │
│  │   Data Layer (Prisma ORM)                    │    │
│  │  PostgreSQL Database                         │    │
│  └──────────────────────┬───────────────────────┘    │
│                         │                             │
│  ┌──────────────────────┴───────────────────────┐    │
│  │   External Services                          │    │
│  │  • Vercel Blob (Image Storage)              │    │
│  │  • Claude API (AI Summaries)                │    │
│  │  • Tesseract.js (OCR)                       │    │
│  │  • NextAuth.js (Authentication)             │    │
│  └───────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## User Roles & Access Control

### Role Matrix
```
╔═══════════╦════════════╦════════════╦════════════╗
║  Feature  ║  Elderly   ║   Doctor   ║   Admin    ║
╠═══════════╬════════════╬════════════╬════════════╣
║ Own Data  ║ READ/WRITE ║     —      ║     —      ║
║ Patient   ║     —      ║ READ/WRITE ║   READ     ║
║ Cases     ║   Accept   ║  Manage    ║  Assign    ║
║ Users     ║     —      ║     —      ║ CRUD       ║
║ System    ║  Limited   ║  Extended  ║   Full     ║
╚═══════════╩════════════╩════════════╩════════════╝
```

### Portal Access
- **Elderly Portal** (`/elderly-portal`): Self-health management
- **Doctor Portal** (`/doctor`): Patient care management
- **Admin Portal** (`/admin`): System administration

---

## Core User Journeys

### Journey 1: Elderly User Registration & Health Tracking
```
1. Home Page Landing
   ↓
2. Register (Email/Password or OAuth)
   ↓
3. Complete Profile Onboarding
   • Personal info (name, birthdate, contact)
   • Health info (allergies, chronic diseases)
   ↓
4. Access Health Portal
   ↓
5. Record Health Data
   • Manual BP entry or image scan
   • Upload medicine photos
   • Get AI health summaries
   ↓
6. Request Doctor Consultation (Optional)
   • Send case request with symptoms
   • Wait for doctor to accept
   • Chat with assigned doctor
   ↓
7. View Medical History
   • Blood pressure trends
   • Medicine inventory
   • AI analysis results
   • Case status updates
```

### Journey 2: Doctor Case Management
```
1. Doctor Login
   ↓
2. View Patient List
   ↓
3. Select Patient → View Profile
   ↓
4. Review Health Data
   • Latest vital signs
   • Medicine inventory
   • AI analysis
   • Chat history
   ↓
5. Take Action
   • Chat with patient
   • Verify AI scan results
   • Schedule appointments
   • Manage case status
   ↓
6. Close Case
   • Document closure reason
   • Update elderly status
   • Archive records
```

### Journey 3: Admin System Management
```
1. Admin Login
   ↓
2. User Management
   • Create accounts
   • Assign roles
   • Monitor activity
   ↓
3. Case Assignment
   • Pair doctors with patients
   • Monitor active cases
   • Resolve conflicts
   ↓
4. Appointment Oversight
   • Review schedules
   • Handle rescheduling
   • Send reminders
   ↓
5. System Monitoring
   • View audit logs
   • Check statistics
   • Monitor performance
```

---

## Data Flow Examples

### Blood Pressure Entry Flow
```
Elderly User
   ↓ (clicks "บันทึกความดัน")
Blood Pressure Form
   ├─ Manual Entry:
   │  ├─ Input systolic, diastolic
   │  ├─ Optional: pulse, time
   │  └─ Submit
   │
   └─ Image Scan:
      ├─ Upload/capture image
      ├─ Send to server
      ├─ Tesseract OCR processing
      └─ Extract values

API: POST /api/elderly/[id]/blood-pressure
   ↓
Validation (Zod schema)
   ↓
BloodPressureRecord Creation
   ↓
Assessment Logic
   • Determine severity (emerald/amber/rose)
   • Generate guidance
   ↓
Database Save
   ↓
Return to UI with assessment
   ↓
Display in Health Records Tab
   ↓
Chat with AI for personalized advice (optional)
   ↓
Doctor can review & comment
```

### Case Request Flow
```
Elderly User
   ↓ (fills case request form)
Case Request Panel
   ├─ Message: symptoms/concerns
   ├─ Submit
   └─ Status → WAITING_DOCTOR

API: POST /api/elderly/[id]/cases
   ↓
DoctorPatient record status
   ↓
Notification to available doctors
   ↓
Doctor Login
   ↓
Doctor Portal → Pending Cases
   ↓
Doctor Reviews Request
   ├─ Review health data
   ├─ Review message
   └─ Accept/Reject case

If Accepted:
   ↓
Status → IN_REVIEW
   ↓
Chat Enable
   ↓
Doctor & Elderly Message Exchange
   ↓
Doctor Closes Case
   ↓
Status → COMPLETED
   ↓
Case archived, history recorded
```

### Appointment Scheduling Flow
```
Doctor Portal
   ↓ (selects patient)
Patient Profile Page
   ↓
DoctorAppointmentForm Component
   ├─ Date picker
   ├─ Time picker
   └─ Notes

API: POST /api/appointments
   ↓
Validation
   ├─ Doctor-patient relationship exists
   ├─ Date not in past
   └─ Time slot available

Create Appointment Record
   ↓
Queue SMS Reminder (24hrs before)
   ↓
Doctor Portal: Appointment confirmed
   ↓
Elderly Portal: Appointment notification
   ↓
At appointment date:
   ├─ Send SMS reminder
   └─ Show in upcoming appointments

After appointment:
   ↓
Mark as COMPLETED
   ↓
Create AppointmentHistory record
   ↓
Update AppointmentReschedule (if any)
```

---

## Key Technologies & Integrations

### Frontend Stack
- **Next.js 16**: React framework with App Router
- **React 19**: UI library with compiler optimization
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Utility-first styling
- **React Hook Form**: Efficient form management
- **Zod**: Runtime type validation
- **React Query**: Server state management

### Backend & Database
- **Node.js**: Runtime environment
- **PostgreSQL**: Relational database
- **Prisma**: Type-safe ORM
- **NextAuth.js**: Authentication & sessions

### External Services
- **Vercel**: Hosting & deployment
- **Vercel Blob**: Image/file storage
- **Claude API**: AI health summaries
- **Tesseract.js**: OCR for medicine labels
- **Sharp**: Image processing & compression
- **Neon**: Serverless PostgreSQL (production option)

### Development Tools
- **Docker**: Local PostgreSQL container
- **ESLint**: Code linting
- **Prisma Studio**: Database GUI
- **Babel React Compiler**: Performance optimization

---

## Authentication Flow

```
┌─────────────────────────────────────────┐
│  User Visits App                        │
└────────────┬────────────────────────────┘
             │
      ┌──────┴───────┐
      ↓              ↓
   Logged In?    Not Logged In?
      │              │
      ↓              ↓
  Dashboard      Auth Pages
      │          ┌────┬──────┬─────┐
      ↓          ↓    ↓      ↓     ↓
  Load Role   Login Reg Forgot Reset
  ↓           │    │      │     │
  Portal      ↓    ↓      ↓     ↓
  Router    Validate Submit Email
      ↓         │       │        │
      ├─────────┴───────┴────────┘
      ↓
  NextAuth Check
      ├─ Credentials Provider
      │  └─ Email/password validation
      │
      ├─ OAuth Providers
      │  ├─ Google
      │  └─ Facebook
      │
      └─ Create JWT Session
      
      ↓
  
  Set Session Cookie
      ↓
  Redirect to Portal
```

### Session Validation
Every request checks:
1. Valid JWT token
2. User exists in database
3. Role matches permissions
4. Related data accessible

---

## Database Entity Relationships

```
User (1:1) ─────────┐
│                   │
├─ ElderlyProfile  ←┘
│
├─ DoctorPatient (N:M through junction)
│   ├─ doctorId → User
│   └─ elderlyId → ElderlyProfile
│
├─ Appointment
│   ├─ doctorId → User
│   └─ elderlyId → ElderlyProfile
│
├─ ChatMessage
│   └─ elderly → ElderlyProfile
│
└─ Account (OAuth)

ElderlyProfile (1:N)
├─ BloodPressureRecord
├─ MedicineImage
├─ AiScan
├─ ChatMessage
├─ AiHealthMessage
├─ Appointment
└─ DoctorPatient

Appointment (1:N)
├─ AppointmentReschedule
└─ AppointmentHistory
```

---

## API Request/Response Pattern

### Standard Request Structure
```http
POST /api/elderly/[id]/blood-pressure
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "systolic": 138,
  "diastolic": 88,
  "pulse": 72,
  "measuredAt": "2026-04-16T10:30:00Z"
}
```

### Standard Response Structure
```json
{
  "success": true,
  "data": {
    "id": "bp123",
    "systolic": 138,
    "diastolic": 88,
    "pulse": 72,
    "measuredAt": "2026-04-16T10:30:00Z",
    "assessment": {
      "tone": "amber",
      "shortLabel": "ค่อนข้างสูง",
      "guidance": "ลองวัดซ้ำหลังพัก..."
    }
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "details": {
    "systolic": "Must be between 0 and 300"
  }
}
```

---

## Deployment Architecture

### Development Environment
```
Local Machine
├─ Next.js Dev Server (port 3000)
├─ PostgreSQL Container (Docker)
├─ File storage: Local uploads/
└─ Environment: .env.local
```

### Production Environment (Vercel + Neon)
```
Vercel Hosting
├─ Next.js App (automatic deployment)
├─ API Routes (serverless functions)
├─ Static assets
└─ Environment: Vercel dashboard

Neon PostgreSQL
├─ Serverless database
├─ Auto-scaling
├─ Backups
└─ High availability

Vercel Blob
├─ Image storage (medicines, BP scans)
├─ CDN delivery
└─ Signed URLs for access

GitHub → Vercel
Auto-deploy on git push
CI/CD pipeline
```

### Build Process
```
1. Git push to main
   ↓
2. Vercel detects change
   ↓
3. Install dependencies
   ↓
4. Prisma schema sync
   ↓
5. Next.js build (TypeScript check, bundling)
   ↓
6. Deploy to Vercel edge network
   ↓
7. DNS routes traffic
   ↓
8. Live in production
```

---

## Performance Considerations

### Optimization Strategies
1. **Database**:
   - Indexes on frequently queried fields
   - Pagination for large datasets
   - Connection pooling via Neon

2. **Frontend**:
   - Code splitting at page boundaries
   - Image optimization via Next.js
   - React 19 concurrent rendering
   - Babel React Compiler

3. **API**:
   - Caching with React Query (5-30min)
   - Request deduplication
   - Gzip compression

4. **Storage**:
   - Sharp image compression
   - Vercel Blob CDN
   - Lazy loading images

---

## Security Measures

### Authentication & Authorization
- JWT-based sessions (NextAuth.js)
- Bcrypt password hashing (10 rounds)
- OAuth provider validation
- Role-based access control (RBAC)

### Data Protection
- HTTPS only (Vercel enforced)
- Environment secrets management
- Database query parameterization (Prisma)
- Input validation via Zod
- CORS configuration

### Audit & Compliance
- Audit logging (AuditLog table)
- Activity tracking
- Data access logging
- Compliance-ready for health data

### Privacy
- PII not stored in logs
- User data isolation
- Password reset workflows
- Session invalidation

---

## Scalability Factors

### Current Capacity
- **Users**: Supports thousands of concurrent users
- **Data**: PostgreSQL handles millions of records
- **Storage**: Vercel Blob (unlimited within tier)
- **API**: Serverless scaling (Vercel Functions)

### Scaling Plan
1. **Horizontal**: Vercel auto-scaling
2. **Database**: Neon auto-scaling + read replicas
3. **Storage**: Vercel Blob CDN
4. **Caching**: Add Redis for session cache
5. **Load**: Use Vercel Analytics to monitor

---

## Monitoring & Observability

### Logs
- **Application**: Pino logging (development)
- **Audit**: AuditLog table (database)
- **Vercel**: Built-in deployment logs
- **Database**: Neon query logs

### Metrics to Track
- Response times
- Error rates
- User growth
- Case completion rate
- Appointment no-show rate

### Alerting
- Error rate threshold (>1%)
- Response time threshold (>3s)
- Database connectivity
- Storage quota warnings

---

## Known Limitations & Future Improvements

### Current Limitations
1. **OCR Accuracy**: Tesseract may struggle with low-quality images
2. **Real-time Updates**: WebSocket would improve chat responsiveness
3. **Mobile**: PWA improvements needed
4. **Accessibility**: WCAG 2.1 AA compliance in progress
5. **Testing**: Limited test coverage

### Planned Improvements
1. Add comprehensive test suite (Jest + React Testing Library)
2. Implement WebSocket for real-time chat
3. Add SMS notifications service
4. Enhance OCR with specialized medical models
5. Dark mode support
6. Mobile app (React Native)
7. Video consultation capability
8. Advanced health analytics dashboard

---

## Support & Documentation

### Available Documentation
- `README.md` - Quick start guide
- `SYSTEM_OVERVIEW.md` - Architecture overview (THIS FILE)
- `DATABASE_SCHEMA.md` - Database entity reference
- `API_DOCUMENTATION.md` - API endpoint details
- `UI_COMPONENTS.md` - Frontend component guide

### Code Navigation Tips
1. Start with `src/app/page.tsx` for entry point
2. Check `src/auth.ts` for auth configuration
3. Review `src/lib/permissions.ts` for access control
4. See `prisma/schema.prisma` for data model
5. Explore `src/components/` for UI patterns

---

## Common Development Tasks

### Add New Feature
1. Add Prisma model in `schema.prisma`
2. Run `npm run db:push`
3. Create API route in `src/app/api/`
4. Create component in `src/components/`
5. Add page in `src/app/`
6. Implement permissions in `src/lib/permissions.ts`

### Debug Issue
1. Check Vercel logs: `vercel logs`
2. Review database: `npm run db:studio`
3. Check browser console (F12)
4. Review Prisma generated types
5. Use TypeScript strict mode

### Deploy Changes
```bash
git add .
git commit -m "feat: description"
git push origin main
# Vercel auto-deploys
```

---

## Summary Statistics

**Codebase**:
- ~15 page routes
- ~20 API routes
- ~30 React components
- ~15 utility modules
- ~15 Prisma models
- ~8,000 lines of TypeScript code

**Technology Diversity**:
- 3 Authentication methods (Credentials, Google, Facebook)
- 4 External API integrations
- 2 Database options (PostgreSQL, Neon)
- 1 Storage provider (Vercel Blob)
- 5+ Third-party libraries

**User Types**:
- Elderly users (patients)
- Doctors (healthcare providers)
- Admins (system managers)
- Caregivers (family members)

**Key Features**:
- Health record management
- AI-powered insights
- Doctor case workflow
- Appointment scheduling
- Real-time messaging
- OCR medicine recognition
- Admin system management

---

## Conclusion

The **Elderly Care AI** system is a comprehensive, modern healthcare application designed with elderly users as the primary focus. It combines:

- **Accessibility**: Large text, clear buttons, easy navigation
- **Functionality**: Complete health tracking and doctor coordination
- **Security**: Role-based access control and audit logging
- **Scalability**: Serverless architecture ready for growth
- **Maintainability**: TypeScript, modular architecture, clean code

The system is production-ready and actively developed, with room for future enhancements in areas like mobile apps, video consultations, and advanced analytics.

---

**For More Information**:
- Review individual documentation files for deep dives
- Check git history for development evolution
- Review code comments for implementation details
- Consult README.md for setup and deployment

**Last Updated**: April 2026
**Status**: Active Production
**Maintained By**: Development Team
