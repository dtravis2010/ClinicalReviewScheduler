#!/usr/bin/env node
import { execSync } from 'child_process';

try {
  const result = execSync('npx vitest run --no-watch --reporter=verbose src/__tests__/services/validationService.test.js', {
    encoding: 'utf-8',
    stdio: 'pipe',
    timeout: 60000
  });
  console.log(result);
} catch (error) {
  console.log(error.stdout || error.message);
  process.exit(error.status || 1);
}
