#!/bin/bash
# Kill any existing vitest processes
pkill -9 -f vitest 2>/dev/null || true
sleep 2

# Run the tests
NODE_ENV=test npx vitest run --no-watch --reporter=verbose src/__tests__/services/validationService.test.js 2>&1
