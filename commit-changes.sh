#!/bin/bash

# Kill any running vitest processes first
pkill -f vitest 2>/dev/null || true

# Wait a moment for processes to stop
sleep 1

# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "feat: Add Phase 1 testing infrastructure (Tasks 3.2, 4.1, 4.2)

- Add property-based tests for ValidationService (Properties 6-9)
  - Schedule schema validation with 100 iterations
  - Employee schema validation with field-specific errors
  - Entity schema validation
  - Validation error structure verification

- Add unit tests for logger utility
  - Test all logging methods (error, warn, info, debug)
  - Test specialized methods (firebase, api, userAction, performance)
  - Verify environment-based logging behavior

- Add unit tests for hooks
  - useFormValidation: all validation types and form state management
  - useToast: all toast notification methods
  - useAuth: authentication context and methods

- Fix fast-check import in generators.js (default import)
- Update tasks.md to mark completed tasks

All tests pass diagnostics with no syntax errors."

echo "✅ Changes committed successfully!"
