# 📚 System Documentation Index

Welcome to the Elderly Care AI system documentation! This index helps you navigate through all available resources.

---

## 🚀 Quick Navigation

### For New Developers
Start here to understand the system from scratch:
1. **[README.md](README.md)** - Quick start, setup instructions
2. **[COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md)** - Complete system overview
3. **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Data model reference
4. **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API endpoints guide
5. **[UI_COMPONENTS.md](UI_COMPONENTS.md)** - Frontend components guide

### For Specific Tasks
- **"How do I set up the project?"** → [README.md](README.md) → Quick Start
- **"What's the database structure?"** → [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **"How do I call the API?"** → [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **"How do I create a component?"** → [UI_COMPONENTS.md](UI_COMPONENTS.md)
- **"What's the system architecture?"** → [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md)

---

## 📖 Documentation Files

### Core Documentation

#### [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md)
**Purpose**: Complete system overview with all key aspects
**Contents**:
- System architecture diagram
- User roles and access control
- Core user journeys
- Data flow examples
- Technology stack
- Deployment architecture
- Performance & security considerations
- Known limitations

**Best for**: Getting holistic understanding of how everything fits together

---

#### [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)
**Purpose**: Detailed system features and structure
**Contents**:
- Project summary
- Technology stack breakdown
- Project structure (file tree)
- Database schema overview
- Authentication & authorization
- Key features by role
- Core workflows
- Deployment instructions
- Build & scripts reference

**Best for**: Understanding available features and how to use them

---

#### [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
**Purpose**: Complete database reference
**Contents**:
- Entity relationship diagram
- Core tables documentation (13 models)
- Field definitions for each table
- Enum values
- Database indexes
- Data constraints
- Common queries
- Migration commands

**Best for**: Understanding data model, writing queries, designing features

**Key Tables**:
- User, ElderlyProfile, DoctorPatient
- BloodPressureRecord, MedicineImage, AiScan
- ChatMessage, AiHealthMessage
- Appointment, AppointmentReschedule, AppointmentHistory
- AuditLog, Account, Session

---

#### [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
**Purpose**: Complete API reference
**Contents**:
- API routes overview
- Authentication routes
- Elderly user endpoints
- Medicine image upload
- Chat messages
- Health summary generation
- Appointment management
- Admin endpoints
- Registration endpoint
- Error handling
- Rate limiting
- Pagination
- File upload process

**Best for**: Building features that call APIs, understanding request/response formats

**Main API Groups**:
- `/api/auth` - Authentication
- `/api/elderly/[id]` - Patient data
- `/api/appointments` - Scheduling
- `/api/admin` - System management
- `/api/register` - Sign up

---

#### [UI_COMPONENTS.md](UI_COMPONENTS.md)
**Purpose**: Frontend component reference
**Contents**:
- Component hierarchy
- Key component details (15+ components)
- Page layouts
- Color palette & styling
- Typography system
- State management
- Accessibility features
- Mobile-first design
- Form handling

**Best for**: Building UI, understanding component patterns, styling

**Key Components**:
- HealthRecordsTabs - Health data display
- ChatPanel - Doctor-patient messaging
- BloodPressureForm - BP entry
- HospitalSharePanel - Hospital carousel
- SummaryCard - Statistics display
- Various forms (elderly, appointment, etc.)

---

### Project Root Documentation

#### [README.md](README.md)
**Purpose**: Quick start & project overview
**Contents**:
- Feature overview (English & Thai)
- Quick start setup
- Environment variables
- Docker setup
- Important medical disclaimers
- Privacy & safety checklist

**Best for**: Initial project setup, understanding project goals

---

#### [AGENTS.md](AGENTS.md)
**Purpose**: AI agent rules for development
**Contents**: Development guidelines for Claude and other agents

---

#### [CLAUDE.md](CLAUDE.md)
**Purpose**: Claude-specific instructions
**Contents**: AI development guidelines

---

## 🗂️ Source Code Organization

### Pages (`src/app/`)
```
pages/
├── page.tsx                    # Home landing page
├── login/, register/           # Authentication pages
├── dashboard/                  # Auth dashboard (redirects)
├── start/                      # Role selection
├── complete-profile/           # Onboarding
├── elderly-portal/             # Elderly user main page
├── doctor/                     # Doctor patient list
├── elderly/[id]/              # Doctor's patient detail view
├── admin/                      # Admin dashboard
└── api/                        # API routes
```

**Navigation**: See [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) for full page structure

### Components (`src/components/`)
```
components/
├── admin/                      # Admin-specific components
├── dashboard/                  # Shared dashboard UI
├── elderly/                    # Elderly-specific components
├── forms/                      # All form components (main UI)
├── ui/                         # Reusable UI elements
├── auth/                       # Auth components
└── providers/                  # Context providers
```

**Details**: See [UI_COMPONENTS.md](UI_COMPONENTS.md) for full component documentation

### Libraries (`src/lib/`)
```
lib/
├── ai.ts                       # AI/OCR processing
├── case-management.ts          # Case workflow logic
├── elderly-profile.ts          # Profile utilities
├── health-presenters.ts        # BP assessment, status display
├── appointment-management.ts   # Appointment logic
├── appointment-sms.ts          # SMS notifications
├── hospital-map.ts             # Hospital data
├── permissions.ts              # Access control
├── storage.ts                  # File uploads
├── audit.ts                    # Activity logging
├── date-time.ts               # Date utilities
├── validations.ts             # Zod schemas
└── prisma.ts                  # DB singleton
```

### Database (`prisma/`)
```
prisma/
└── schema.prisma              # Prisma data model (13 models)
```

**Reference**: See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for detailed schema

---

## 🔍 Finding What You Need

### By Task

| Task | Documentation |
|------|---------------|
| Set up project locally | [README.md](README.md) → Quick Start |
| Understand architecture | [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) |
| Add new database model | [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) |
| Create new API endpoint | [API_DOCUMENTATION.md](API_DOCUMENTATION.md) |
| Build new component | [UI_COMPONENTS.md](UI_COMPONENTS.md) |
| Find specific feature | [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) |
| Debug permission issue | [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) + [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) |
| Understand user flow | [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) → User Journeys |
| Check API format | [API_DOCUMENTATION.md](API_DOCUMENTATION.md) → Error Handling |
| Style new component | [UI_COMPONENTS.md](UI_COMPONENTS.md) → Styling System |

### By Role

**Frontend Developer**:
1. [UI_COMPONENTS.md](UI_COMPONENTS.md) - Component library
2. [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) - Features overview
3. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API integration

**Backend Developer**:
1. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Data model
2. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Endpoints
3. [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) - System design

**Full Stack Developer**:
1. [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) - Full picture
2. All specific docs as needed

**DevOps/Infrastructure**:
1. [README.md](README.md) - Setup & deployment
2. [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) - Infrastructure section

---

## 🔑 Key Concepts Explained

### User Roles
- **ELDERLY**: Primary user, manages own health
- **DOCTOR**: Healthcare provider, reviews patients
- **ADMIN**: System administrator, manages users and cases
- **CAREGIVER**: Legacy role for family members

See: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) → Enums

### Case Status Flow
```
SELF_SERVICE → WAITING_DOCTOR → IN_REVIEW → COMPLETED
(Initial)     (Requested)      (Accepted)   (Closed)
```

See: [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) → Case Request Flow

### Blood Pressure Assessment
```
≥180 or ≥120 → Danger (rose) - Emergency
≥140 or ≥90  → High (rose) - Monitor closely  
<90 or <60   → Low (amber) - Check symptoms
≥120 or ≥80  → Elevated (amber) - Continue monitoring
Otherwise    → Normal (emerald)
```

See: [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) → Key Features

### Authentication
- Credentials (Email/Password)
- Google OAuth
- Facebook OAuth
- JWT sessions

See: [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) → Authentication Flow

---

## 📊 Document Quick Reference

| Document | Lines | Topics | Best For |
|----------|-------|--------|----------|
| [README.md](README.md) | ~200 | Setup, features, warnings | Initial setup |
| [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) | ~600 | Full system overview | Understanding features |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | ~800 | Database model, tables, queries | Database work |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | ~700 | All API endpoints | Building features |
| [UI_COMPONENTS.md](UI_COMPONENTS.md) | ~750 | Frontend components, styling | UI development |
| [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) | ~500 | Full system architecture | System understanding |

---

## 💡 Tips for Documentation Navigation

1. **Start with [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md)** - Gets the big picture
2. **Jump to specific docs** - Based on what you're working on
3. **Use cross-references** - Links between docs for context
4. **Check code comments** - Source files have inline documentation
5. **Review git history** - See how features evolved: `git log --oneline`
6. **Use Prisma Studio** - Visualize database: `npm run db:studio`
7. **Check Vercel logs** - Monitor production: `vercel logs`

---

## 🔗 Related Resources

### In Repository
- `src/auth.ts` - Authentication configuration
- `src/lib/permissions.ts` - Access control logic
- `prisma/schema.prisma` - Database definition
- `.env.example` - Environment variables template
- `docker-compose.yml` - Local dev setup
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

### External
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://authjs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)

---

## 📝 Documentation Maintenance

### Update Frequency
- Main docs: Updated with major features
- API docs: Updated when routes change
- Schema docs: Updated when models change
- Architecture docs: Updated for major refactors

### How to Update
1. Make code changes
2. Update relevant documentation file
3. Update [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) (this file) if new topics added
4. Commit with: `docs: description of change`

### Version History
- **April 2026**: Initial comprehensive documentation created
- **Commit 9ccdca4**: Hospital carousel feature documented
- **Active**: Continuous updates as project evolves

---

## ❓ FAQ

**Q: Where do I start learning the codebase?**
A: Read [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) first, then dive into specific docs.

**Q: How do I add a new feature?**
A: [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) → "Common Development Tasks"

**Q: What's the database structure?**
A: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) has complete reference

**Q: How do I build an API?**
A: [API_DOCUMENTATION.md](API_DOCUMENTATION.md) shows patterns and examples

**Q: Where are the components?**
A: [UI_COMPONENTS.md](UI_COMPONENTS.md) documents all components

**Q: How does authentication work?**
A: See [COMPLETE_ARCHITECTURE.md](COMPLETE_ARCHITECTURE.md) → Authentication Flow

**Q: How do I deploy changes?**
A: [README.md](README.md) → Deployment sections

---

## 📞 Support

If you need clarification on any topic:
1. Check the relevant documentation file
2. Search documentation for keywords
3. Review source code comments
4. Check git commit messages for context
5. Review related code files

---

**Documentation Last Updated**: April 2026
**System Version**: 1.0.0
**Status**: Active Development

Happy coding! 🚀
