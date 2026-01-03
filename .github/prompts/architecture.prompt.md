You are a principal software architect.

TASK:
- Build a mental model of this Clinical Review Scheduler repository.
- Explain the system end-to-end.
- Identify core modules, data flow, and dependencies.

CONTEXT:
This is a full-stack application for scheduling clinical reviews with:
- **Backend**: ASP.NET Core 8.0 Web API with Entity Framework Core
- **Frontend**: React 18 with TypeScript, Vite, and TailwindCSS
- **Database**: SQL Server (Azure SQL)
- **Auth**: Azure AD B2C integration
- **Deployment**: Azure (App Service, Static Web Apps)

CORE MODULES TO ANALYZE:
1. **API Layer** (`/api/ClinicalReviewScheduler.Api/`)
   - Controllers: ClinicalReviews, Reviewers, ScheduleSlots
   - Authentication middleware and configuration

2. **Domain Layer** (`/api/ClinicalReviewScheduler.Domain/`)
   - Entities: ClinicalReview, Reviewer, ScheduleSlot
   - Enums: ReviewStatus, ReviewerType

3. **Infrastructure Layer** (`/api/ClinicalReviewScheduler.Infrastructure/`)
   - ApplicationDbContext and EF Core configuration
   - Repository implementations
   - Migrations

4. **Frontend** (`/frontend/`)
   - React components with TypeScript
   - API client services
   - Azure AD B2C authentication (MSAL)
   - State management patterns

KEY DATA FLOWS TO TRACE:
- Clinical review creation and scheduling workflow
- Reviewer assignment and availability management
- Schedule slot booking and conflict resolution
- Authentication flow (Azure AD B2C → API → Protected resources)

RULES:
- Do NOT suggest changes yet.
- Call out tight coupling, hidden complexity, and risk areas.
- Use diagrams in text form if helpful.
- Pay attention to the Clean Architecture patterns used.

OUTPUT:
- High-level system overview
- Module responsibilities and boundaries
- API endpoint mapping
- Entity relationships
- Frontend-to-backend integration points
- Architectural risks and technical debt
- Azure deployment architecture considerations
