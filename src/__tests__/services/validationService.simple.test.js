import { describe, it, expect } from 'vitest';
import { ValidationService } from '../../services/validationService.js';

describe('ValidationService - Simple Test', () => {
  it('should validate a simple schedule', () => {
    const validSchedule = {
      name: 'Test Schedule',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      status: 'draft',
      assignments: {},
      darEntities: {},
      darCount: 3
    };
    
    const result = ValidationService.validateSchedule(validSchedule);
    expect(result.success).toBe(true);
  });
});
