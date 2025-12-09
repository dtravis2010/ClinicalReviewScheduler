# Design Document

## Overview

This design document outlines comprehensive improvements to the Clinical Review Scheduler application. The improvements are organized into five major areas:

1. **Testing Infrastructure & Data Validation** - Foundation for reliability
2. **Audit Trail & Error Handling** - Accountability and robustness
3. **UX Improvements** - Auto-save, undo/redo, conflict detection
4. **Code Quality & Performance** - Refactoring and optimization
5. **Accessibility** - Keyboard navigation and screen reader support

The design maintains backward compatibility with existing data structures while adding new capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                            │
│  ├─ Pages (Dashboard, UserView, Login)                      │
│  ├─ Feature Components (ScheduleGrid, EmployeeManagement)   │
│  └─ UI Components (Modal, Toast, Skeleton)                  │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                        │
│  ├─ Validation (Zod schemas)                                │
│  ├─ State Management (Hooks, Context)                       │
│  ├─ Undo/Redo Manager                                       │
│  └─ Conflict Detection                                      │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer                                           │
│  ├─ Firebase Service (CRUD operations)                      │
│  ├─ Audit Logger                                            │
│  └─ Transaction Manager                                     │
├─────────────────────────────────────────────────────────────┤
│  Testing Layer                                               │
│  ├─ Unit Tests (Vitest)                                     │
│  ├─ Property-Based Tests (fast-check)                       │
│  └─ Test Utilities (Firebase mocks)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Firestore   │
                    │   Database    │
                    └───────────────┘
```

### New Collections

```
firestore/
├── employees/          (existing)
├── entities/           (existing)
├── schedules/          (existing)
├── settings/           (existing)
├── auditLogs/          (new)
│   └── {logId}
│       ├── timestamp
│       ├── userId
│       ├── userEmail
│       ├── action
│       ├── resourceType
│       ├── resourceId
│       ├── changes
│       └── metadata
└── scheduleTemplates/  (new)
    └── {templateId}
        ├── name
        ├── createdBy
        ├── createdAt
        ├── assignments
        ├── darEntities
        └── darCount
```

## Components and Interfaces

### 1. Testing Infrastructure

#### Test Structure
```
src/
├── __tests__/
│   ├── unit/
│   │   ├── validation/
│   │   │   ├── scheduleValidation.test.js
│   │   │   ├── employeeValidation.test.js
│   │   │   └── entityValidation.test.js
│   │   ├── utils/
│   │   │   ├── assignmentLogic.test.js
│   │   │   ├── conflictDetection.test.js
│   │   │   └── workloadCalculation.test.js
│   │   └── hooks/
│   │       ├── useAutoSave.test.js
│   │       ├── useUndoRedo.test.js
│   │       └── useConflictDetection.test.js
│   ├── property/
│   │   ├── assignmentProperties.test.js
│   │   ├── validationProperties.test.js
│   │   └── stateManagementProperties.test.js
│   ├── integration/
│   │   ├── scheduleWorkflow.test.js
│   │   ├── employeeManagement.test.js
│   │   └── auditTrail.test.js
│   └── helpers/
│       ├── firebaseMocks.js
│       ├── testData.js
│       └── testUtils.js
└── vitest.config.js
```

#### Test Configuration
```javascript
// vitest.config.js
export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/']
    }
  }
}
```

### 2. Data Validation Layer

#### Zod Schemas

```javascript
// src/schemas/scheduleSchema.js
import { z } from 'zod';

export const assignmentSchema = z.object({
  dars: z.array(z.number()).optional(),
  cpoe: z.boolean().optional(),
  newIncoming: z.array(z.string()).optional(),
  crossTraining: z.array(z.string()).optional(),
  specialProjects: z.array(z.string()).optional()
});

export const scheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  status: z.enum(['draft', 'published']),
  assignments: z.record(z.string(), assignmentSchema),
  darEntities: z.record(z.number().toString(), z.array(z.string())),
  darCount: z.number().min(3).max(8),
  createdAt: z.any(),
  updatedAt: z.any()
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate']
});

export const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  skills: z.array(z.enum(['DAR', 'Trace', 'CPOE', 'Float'])).min(1, 'At least one skill required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
  archived: z.boolean(),
  createdAt: z.any(),
  updatedAt: z.any()
});

export const entitySchema = z.object({
  name: z.string().min(1, 'Entity name is required'),
  createdAt: z.any(),
  updatedAt: z.any()
});
```

#### Validation Service

```javascript
// src/services/validationService.js
import { scheduleSchema, employeeSchema, entitySchema } from '../schemas';

export class ValidationService {
  /**
   * Validate schedule data
   * @param {Object} data - Schedule data to validate
   * @returns {Object} { success: boolean, data?: Object, errors?: Array }
   */
  static validateSchedule(data) {
    const result = scheduleSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }

  /**
   * Validate employee data
   */
  static validateEmployee(data) {
    const result = employeeSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }

  /**
   * Validate entity data
   */
  static validateEntity(data) {
    const result = entitySchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
}
```

### 3. Audit Trail System

#### Audit Log Schema

```javascript
// src/schemas/auditLogSchema.js
export const auditLogSchema = z.object({
  timestamp: z.any(),
  userId: z.string(),
  userEmail: z.string().email(),
  action: z.enum([
    'schedule.create',
    'schedule.update',
    'schedule.publish',
    'schedule.delete',
    'employee.create',
    'employee.update',
    'employee.archive',
    'entity.create',
    'entity.update',
    'entity.delete'
  ]),
  resourceType: z.enum(['schedule', 'employee', 'entity']),
  resourceId: z.string(),
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});
```

#### Audit Service

```javascript
// src/services/auditService.js
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';

export class AuditService {
  /**
   * Log an action to the audit trail
   * @param {Object} params
   * @param {string} params.action - Action type
   * @param {string} params.resourceType - Type of resource
   * @param {string} params.resourceId - ID of resource
   * @param {Object} params.changes - Changed fields
   * @param {Object} params.metadata - Additional metadata
   * @param {Object} params.user - Current user object
   */
  static async log({ action, resourceType, resourceId, changes = {}, metadata = {}, user }) {
    try {
      const logEntry = {
        timestamp: serverTimestamp(),
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        action,
        resourceType,
        resourceId,
        changes,
        metadata
      };

      await addDoc(collection(db, 'auditLogs'), logEntry);
      logger.info(`Audit log created: ${action} on ${resourceType}/${resourceId}`);
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Get audit logs for a specific resource
   * @param {string} resourceType
   * @param {string} resourceId
   * @param {number} maxResults
   * @returns {Promise<Array>}
   */
  static async getLogsForResource(resourceType, resourceId, maxResults = 50) {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  /**
   * Get recent audit logs
   * @param {number} maxResults
   * @returns {Promise<Array>}
   */
  static async getRecentLogs(maxResults = 100) {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      logger.error('Failed to fetch recent audit logs:', error);
      return [];
    }
  }
}
```

### 4. Auto-save System

#### Auto-save Hook

```javascript
// src/hooks/useAutoSave.js
import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from './useToast';
import { logger } from '../utils/logger';

/**
 * Hook for auto-saving data with debouncing
 * @param {Function} saveFunction - Function to call for saving
 * @param {any} data - Data to save
 * @param {Object} options - Configuration options
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @param {boolean} options.enabled - Whether auto-save is enabled
 * @returns {Object} { isSaving, lastSaved, error, forceSave }
 */
export function useAutoSave(saveFunction, data, options = {}) {
  const {
    debounceMs = 2000,
    enabled = true
  } = options;

  const { showError, showInfo } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(data);
  const saveInProgressRef = useRef(false);

  const performSave = useCallback(async () => {
    if (saveInProgressRef.current) {
      logger.debug('Save already in progress, skipping');
      return;
    }

    try {
      saveInProgressRef.current = true;
      setIsSaving(true);
      setError(null);

      await saveFunction(data);

      setLastSaved(new Date());
      previousDataRef.current = data;
      logger.info('Auto-save completed successfully');
    } catch (err) {
      logger.error('Auto-save failed:', err);
      setError(err);
      showError('Failed to auto-save changes');
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  }, [saveFunction, data, showError]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSave();
  }, [performSave]);

  useEffect(() => {
    if (!enabled) return;

    // Check if data has actually changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    forceSave
  };
}
```

### 5. Undo/Redo System

#### Undo/Redo Manager

```javascript
// src/utils/undoRedoManager.js

/**
 * Manages undo/redo state for schedule changes
 */
export class UndoRedoManager {
  constructor(maxHistorySize = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Add a change to the undo stack
   * @param {Object} change - The change object
   * @param {any} change.before - State before change
   * @param {any} change.after - State after change
   * @param {string} change.description - Human-readable description
   */
  addChange(change) {
    this.undoStack.push(change);
    
    // Clear redo stack when new change is made
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the last change
   * @returns {Object|null} The change that was undone
   */
  undo() {
    if (this.undoStack.length === 0) {
      return null;
    }

    const change = this.undoStack.pop();
    this.redoStack.push(change);
    return change;
  }

  /**
   * Redo the last undone change
   * @returns {Object|null} The change that was redone
   */
  redo() {
    if (this.redoStack.length === 0) {
      return null;
    }

    const change = this.redoStack.pop();
    this.undoStack.push(change);
    return change;
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get undo stack size
   * @returns {number}
   */
  getUndoCount() {
    return this.undoStack.length;
  }

  /**
   * Get redo stack size
   * @returns {number}
   */
  getRedoCount() {
    return this.redoStack.length;
  }
}
```

#### Undo/Redo Hook

```javascript
// src/hooks/useUndoRedo.js
import { useState, useCallback, useRef } from 'react';
import { UndoRedoManager } from '../utils/undoRedoManager';

/**
 * Hook for undo/redo functionality
 * @param {any} initialState - Initial state value
 * @returns {Object} { state, setState, undo, redo, canUndo, canRedo, clear }
 */
export function useUndoRedo(initialState) {
  const [state, setStateInternal] = useState(initialState);
  const managerRef = useRef(new UndoRedoManager());

  const setState = useCallback((newState, description = 'Change') => {
    const manager = managerRef.current;
    
    // Add to undo stack
    manager.addChange({
      before: state,
      after: newState,
      description
    });

    setStateInternal(newState);
  }, [state]);

  const undo = useCallback(() => {
    const manager = managerRef.current;
    const change = manager.undo();
    
    if (change) {
      setStateInternal(change.before);
      return true;
    }
    return false;
  }, []);

  const redo = useCallback(() => {
    const manager = managerRef.current;
    const change = manager.redo();
    
    if (change) {
      setStateInternal(change.after);
      return true;
    }
    return false;
  }, []);

  const clear = useCallback(() => {
    managerRef.current.clear();
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: managerRef.current.canUndo(),
    canRedo: managerRef.current.canRedo(),
    clear
  };
}
```

### 6. Conflict Detection System

#### Conflict Detection Utility

```javascript
// src/utils/conflictDetection.js

/**
 * Detect conflicts in schedule assignments
 * @param {Object} assignments - Current assignments
 * @param {Object} darEntities - DAR entity assignments
 * @param {Array} employees - List of employees
 * @param {Array} entities - List of entities
 * @returns {Object} { conflicts: Array, warnings: Array }
 */
export function detectConflicts(assignments, darEntities, employees, entities) {
  const conflicts = [];
  const warnings = [];

  // Check for employees assigned to multiple entities
  Object.entries(assignments).forEach(([employeeId, assignment]) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const assignedEntities = [];

    // Collect all entity assignments
    if (assignment.newIncoming?.length > 0) {
      assignedEntities.push(...assignment.newIncoming);
    }
    if (assignment.crossTraining?.length > 0) {
      assignedEntities.push(...assignment.crossTraining);
    }

    // Check for duplicates
    if (assignedEntities.length > 1) {
      warnings.push({
        type: 'employee_multiple_entities',
        severity: 'warning',
        employeeId,
        employeeName: employee.name,
        entities: assignedEntities,
        message: `${employee.name} is assigned to multiple entities: ${assignedEntities.join(', ')}`
      });
    }
  });

  // Check for entities assigned to multiple DAR columns
  const entityToDarMap = new Map();
  Object.entries(darEntities).forEach(([darIndex, entityList]) => {
    if (Array.isArray(entityList)) {
      entityList.forEach(entity => {
        if (!entityToDarMap.has(entity)) {
          entityToDarMap.set(entity, []);
        }
        entityToDarMap.get(entity).push(parseInt(darIndex));
      });
    }
  });

  entityToDarMap.forEach((darIndices, entity) => {
    if (darIndices.length > 1) {
      warnings.push({
        type: 'entity_multiple_dars',
        severity: 'warning',
        entity,
        darIndices,
        message: `${entity} is assigned to multiple DAR columns: ${darIndices.map(i => `DAR ${i + 1}`).join(', ')}`
      });
    }
  });

  // Check for skill mismatches
  Object.entries(assignments).forEach(([employeeId, assignment]) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    // Check DAR assignments
    if (assignment.dars?.length > 0) {
      const canDoDAR = employee.skills?.includes('DAR') || employee.skills?.includes('Float');
      if (!canDoDAR) {
        conflicts.push({
          type: 'skill_mismatch',
          severity: 'error',
          employeeId,
          employeeName: employee.name,
          requiredSkill: 'DAR',
          message: `${employee.name} is assigned to DAR but doesn't have DAR or Float skill`
        });
      }
    }

    // Check CPOE assignments
    if (assignment.cpoe) {
      const canDoCPOE = employee.skills?.includes('CPOE') || employee.skills?.includes('Float');
      if (!canDoCPOE) {
        conflicts.push({
          type: 'skill_mismatch',
          severity: 'error',
          employeeId,
          employeeName: employee.name,
          requiredSkill: 'CPOE',
          message: `${employee.name} is assigned to CPOE but doesn't have CPOE or Float skill`
        });
      }
    }
  });

  return { conflicts, warnings };
}

/**
 * Calculate workload for each employee
 * @param {Object} assignments - Current assignments
 * @param {Array} employees - List of employees
 * @returns {Map} Map of employeeId to workload score
 */
export function calculateWorkload(assignments, employees) {
  const workloadMap = new Map();

  employees.forEach(employee => {
    const assignment = assignments[employee.id] || {};
    let score = 0;

    // DAR assignments (weight: 3)
    score += (assignment.dars?.length || 0) * 3;

    // CPOE assignment (weight: 2)
    if (assignment.cpoe) score += 2;

    // New Incoming (weight: 2)
    score += (assignment.newIncoming?.length || 0) * 2;

    // Cross-Training (weight: 1)
    score += (assignment.crossTraining?.length || 0) * 1;

    // Special Projects (weight: 2)
    score += (assignment.specialProjects?.length || 0) * 2;

    workloadMap.set(employee.id, score);
  });

  return workloadMap;
}

/**
 * Detect workload imbalances
 * @param {Map} workloadMap - Map of employeeId to workload score
 * @param {Array} employees - List of employees
 * @param {number} threshold - Threshold percentage for imbalance (default: 50%)
 * @returns {Array} List of imbalance warnings
 */
export function detectWorkloadImbalances(workloadMap, employees, threshold = 0.5) {
  const warnings = [];
  const workloads = Array.from(workloadMap.values());
  
  if (workloads.length === 0) return warnings;

  const avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
  const maxDeviation = avgWorkload * threshold;

  workloadMap.forEach((workload, employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    if (workload > avgWorkload + maxDeviation) {
      warnings.push({
        type: 'workload_high',
        severity: 'warning',
        employeeId,
        employeeName: employee.name,
        workload,
        avgWorkload,
        message: `${employee.name} has significantly higher workload (${workload}) than average (${avgWorkload.toFixed(1)})`
      });
    } else if (workload < avgWorkload - maxDeviation && workload > 0) {
      warnings.push({
        type: 'workload_low',
        severity: 'info',
        employeeId,
        employeeName: employee.name,
        workload,
        avgWorkload,
        message: `${employee.name} has significantly lower workload (${workload}) than average (${avgWorkload.toFixed(1)})`
      });
    }
  });

  return warnings;
}
```

#### Conflict Detection Hook

```javascript
// src/hooks/useConflictDetection.js
import { useMemo } from 'react';
import { detectConflicts, calculateWorkload, detectWorkloadImbalances } from '../utils/conflictDetection';

/**
 * Hook for detecting conflicts and workload issues
 * @param {Object} assignments - Current assignments
 * @param {Object} darEntities - DAR entity assignments
 * @param {Array} employees - List of employees
 * @param {Array} entities - List of entities
 * @returns {Object} { conflicts, warnings, workloadMap, workloadWarnings, hasIssues }
 */
export function useConflictDetection(assignments, darEntities, employees, entities) {
  const result = useMemo(() => {
    const { conflicts, warnings } = detectConflicts(assignments, darEntities, employees, entities);
    const workloadMap = calculateWorkload(assignments, employees);
    const workloadWarnings = detectWorkloadImbalances(workloadMap, employees);

    return {
      conflicts,
      warnings,
      workloadMap,
      workloadWarnings,
      hasIssues: conflicts.length > 0 || warnings.length > 0 || workloadWarnings.length > 0
    };
  }, [assignments, darEntities, employees, entities]);

  return result;
}
```

## Data Models

### Audit Log Model

```javascript
{
  id: string,
  timestamp: Timestamp,
  userId: string,
  userEmail: string,
  action: 'schedule.create' | 'schedule.update' | 'schedule.publish' | ...,
  resourceType: 'schedule' | 'employee' | 'entity',
  resourceId: string,
  changes: {
    [fieldName]: {
      before: any,
      after: any
    }
  },
  metadata: {
    [key]: any
  }
}
```

### Schedule Template Model

```javascript
{
  id: string,
  name: string,
  createdBy: string,
  createdAt: Timestamp,
  assignments: {
    [employeeId]: Assignment
  },
  darEntities: {
    [darIndex]: string[]
  },
  darCount: number
}
```

### Conflict Model

```javascript
{
  type: 'employee_multiple_entities' | 'entity_multiple_dars' | 'skill_mismatch',
  severity: 'error' | 'warning' | 'info',
  employeeId?: string,
  employeeName?: string,
  entity?: string,
  entities?: string[],
  darIndices?: number[],
  requiredSkill?: string,
  message: string
}
```

### Workload Model

```javascript
{
  employeeId: string,
  employeeName: string,
  darCount: number,
  cpoeCount: number,
  newIncomingCount: number,
  crossTrainingCount: number,
  specialProjectsCount: number,
  totalScore: number
}
```

