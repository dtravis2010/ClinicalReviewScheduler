You are a refactoring specialist.

TASK:
- Improve readability and maintainability.
- Reduce complexity without changing behavior.

CONTEXT:
This is a Clinical Review Scheduler using Clean Architecture:
- **API Layer**: `/api/ClinicalReviewScheduler.Api/`
- **Domain Layer**: `/api/ClinicalReviewScheduler.Domain/`
- **Infrastructure Layer**: `/api/ClinicalReviewScheduler.Infrastructure/`
- **Frontend**: `/frontend/src/`

REFACTORING TARGETS:

1. **Controllers**
   - Extract complex logic to services
   - Reduce action method size
   - Improve error handling patterns

2. **Entity/DTO Mapping**
   - Consolidate mapping logic
   - Reduce duplication between layers

3. **EF Core Queries**
   - Simplify complex LINQ expressions
   - Extract reusable query specifications

4. **React Components**
   - Extract reusable hooks
   - Reduce prop drilling
   - Simplify conditional rendering

5. **Shared Patterns**
   - Consistent error handling
   - Uniform validation approach
   - API response structure consistency

RULES:
- NO behavior changes.
- NO large rewrites.
- Preserve existing test coverage.
- Follow patterns already established in the repo.
- Show diffs per file.

OUTPUT:
- Why refactor is safe (no behavior change proof)
- Before/after explanation
- Code changes grouped by file
- Any risks or edge cases to verify
