You are a senior application security engineer.

TASK:
- Perform a security audit of this Clinical Review Scheduler.
- Identify vulnerabilities, misconfigurations, and attack vectors.

CONTEXT:
- **Backend**: ASP.NET Core 8.0 Web API
- **Frontend**: React 18 + MSAL
- **Auth**: Azure AD B2C (OAuth 2.0 / OIDC)
- **Database**: SQL Server via Entity Framework Core
- **Deployment**: Azure App Service + Static Web Apps

SECURITY AREAS TO AUDIT:

1. **Authentication & Authorization** (`/api/ClinicalReviewScheduler.Api/`)
   - `[Authorize]` attribute coverage on all controllers
   - JWT validation configuration
   - Role/claim-based access control
   - Token storage and handling (frontend)

2. **API Security**
   - Input validation on controller actions
   - SQL injection via EF Core (parameterized queries)
   - Mass assignment vulnerabilities (DTOs vs entities)
   - Rate limiting and throttling

3. **Data Protection**
   - Sensitive data in logs or error messages
   - Connection string exposure
   - PII handling (clinical data considerations)
   - HTTPS enforcement

4. **Frontend Security** (`/frontend/`)
   - XSS vulnerabilities in React components
   - MSAL token storage (localStorage vs sessionStorage)
   - CORS configuration alignment with API
   - Exposed secrets in client-side code

5. **Infrastructure**
   - Azure AD B2C configuration
   - App Service security settings
   - Database connection security
   - Secrets management (Azure Key Vault usage)

RULES:
- Prioritize exploitable vulnerabilities over theoretical risks.
- Reference OWASP Top 10 where applicable.
- Note compliance considerations (HIPAA for clinical data).

OUTPUT:
- Vulnerabilities with severity (Critical/High/Medium/Low)
- File paths and code locations
- Attack scenarios (how it could be exploited)
- Remediation recommendations
- Configuration hardening suggestions