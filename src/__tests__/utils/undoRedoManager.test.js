import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { UndoRedoManager } from '../../utils/undoRedoManager';

describe('UndoRedoManager', () => {
  describe('Property Tests', () => {
    /**
     * Feature: scheduler-improvements, Property 18: Undo stack growth
     * Validates: Requirements 6.1
     */
    it('Property 18: adding changes grows undo stack', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 10 }),
          (changes) => {
            const manager = new UndoRedoManager(0);
            
            changes.forEach(change => {
              manager.addChange(change);
            });
            
            // Undo stack should have all changes (up to limit)
            const expectedSize = Math.min(changes.length, 50);
            return manager.getUndoStackSize() === expectedSize;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 19: Undo operation correctness
     * Validates: Requirements 6.2
     */
    it('Property 19: undo returns to previous state', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(),
          (state1, state2) => {
            const manager = new UndoRedoManager(state1);
            manager.addChange(state2);
            
            const undoneState = manager.undo();
            
            // Undoing should return to state1
            return undoneState === state1;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 20: Undo-redo round trip
     * Validates: Requirements 6.3
     */
    it('Property 20: undo then redo returns to current state', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(),
          (state1, state2) => {
            const manager = new UndoRedoManager(state1);
            manager.addChange(state2);
            
            manager.undo();
            const redoneState = manager.redo();
            
            // Redo after undo should return to state2
            return redoneState === state2;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 21: Undo button state consistency
     * Validates: Requirements 6.4
     */
    it('Property 21: canUndo is true when undo stack has items', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 10 }),
          (changes) => {
            const manager = new UndoRedoManager(0);
            
            // Initially should not be able to undo
            if (manager.canUndo()) return false;
            
            // Add changes
            changes.forEach(change => {
              manager.addChange(change);
            });
            
            // Should be able to undo after adding changes
            if (!manager.canUndo()) return false;
            
            // Undo all changes
            while (manager.canUndo()) {
              manager.undo();
            }
            
            // Should not be able to undo after undoing everything
            return !manager.canUndo();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 22: Redo button state consistency
     * Validates: Requirements 6.5
     */
    it('Property 22: canRedo is true only after undo', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 10 }),
          (changes) => {
            const manager = new UndoRedoManager(0);
            
            // Initially should not be able to redo
            if (manager.canRedo()) return false;
            
            // Add changes
            changes.forEach(change => {
              manager.addChange(change);
            });
            
            // Should not be able to redo after adding changes
            if (manager.canRedo()) return false;
            
            // Undo once
            if (manager.canUndo()) {
              manager.undo();
              
              // Should be able to redo after undo
              if (!manager.canRedo()) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 23: Redo stack clearing on new change
     * Validates: Requirements 6.6
     */
    it('Property 23: adding new change clears redo stack', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(),
          fc.integer(),
          (state1, state2, state3) => {
            const manager = new UndoRedoManager(state1);
            manager.addChange(state2);
            manager.undo();
            
            // Should be able to redo
            if (!manager.canRedo()) return false;
            
            // Add new change
            manager.addChange(state3);
            
            // Redo stack should be cleared
            return !manager.canRedo();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 24: Undo/redo history persistence
     * Validates: Requirements 6.7
     */
    it('Property 24: history persists across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 3, maxLength: 10 }),
          (changes) => {
            const manager = new UndoRedoManager(0);
            
            // Add all changes
            changes.forEach(change => {
              manager.addChange(change);
            });
            
            const finalState = manager.getCurrentState();
            
            // Undo half
            const undoCount = Math.floor(changes.length / 2);
            for (let i = 0; i < undoCount; i++) {
              manager.undo();
            }
            
            // Redo back
            for (let i = 0; i < undoCount; i++) {
              manager.redo();
            }
            
            // Should be back to final state
            return manager.getCurrentState() === finalState;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should initialize with correct state', () => {
      const manager = new UndoRedoManager(42);
      expect(manager.getCurrentState()).toBe(42);
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it('should enforce stack size limit', () => {
      const manager = new UndoRedoManager(0, { limit: 3 });
      
      // Add 5 changes
      for (let i = 1; i <= 5; i++) {
        manager.addChange(i);
      }
      
      // Should only keep last 3 in undo stack
      expect(manager.getUndoStackSize()).toBe(3);
    });

    it('should handle undo when stack is empty', () => {
      const manager = new UndoRedoManager(42);
      const result = manager.undo();
      
      expect(result).toBe(42);
      expect(manager.getCurrentState()).toBe(42);
    });

    it('should handle redo when stack is empty', () => {
      const manager = new UndoRedoManager(42);
      const result = manager.redo();
      
      expect(result).toBe(42);
      expect(manager.getCurrentState()).toBe(42);
    });

    it('should clear history', () => {
      const manager = new UndoRedoManager(0);
      manager.addChange(1);
      manager.addChange(2);
      manager.undo();
      
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(true);
      
      manager.clear();
      
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it('should handle complex object states', () => {
      const state1 = { name: 'test1', count: 1 };
      const state2 = { name: 'test2', count: 2 };
      
      const manager = new UndoRedoManager(state1);
      manager.addChange(state2);
      
      const undoneState = manager.undo();
      expect(undoneState).toEqual(state1);
      
      const redoneState = manager.redo();
      expect(redoneState).toEqual(state2);
    });
  });
});
