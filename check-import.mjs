#!/usr/bin/env node
try {
  await import('./src/__tests__/services/validationService.test.js');
  console.log('Import successful');
} catch (error) {
  console.error('Import failed:', error.message);
  console.error(error.stack);
}
