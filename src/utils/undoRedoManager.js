/**
 * Undo/Redo Manager for managing state history
 * Implements a stack-based undo/redo system with size limits
 */
export class UndoRedoManager {
  /**
   * Create an UndoRedoManager
   * @param {*} initialState - Initial state value
   * @param {Object} options - Configuration options
   * @param {number} options.limit - Maximum number of history items (default: 50)
   */
  constructor(initialState, options = {}) {
    this.limit = options.limit || 50;
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = initialState;
  }

  /**
   * Add a new state change to the undo stack
   * Clears the redo stack when a new change is added
   * @param {*} newState - The new state to add
   */
  addChange(newState) {
    // Push current state to undo stack
    this.undoStack.push(this.currentState);
    
    // Enforce stack size limit
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift(); // Remove oldest item
    }
    
    // Clear redo stack when new change is made
    this.redoStack = [];
    
    // Update current state
    this.currentState = newState;
  }

  /**
   * Undo the last change
   * @returns {*} The previous state, or current state if nothing to undo
   */
  undo() {
    if (!this.canUndo()) {
      return this.currentState;
    }

    // Push current state to redo stack
    this.redoStack.push(this.currentState);
    
    // Pop from undo stack
    this.currentState = this.undoStack.pop();
    
    return this.currentState;
  }

  /**
   * Redo the last undone change
   * @returns {*} The next state, or current state if nothing to redo
   */
  redo() {
    if (!this.canRedo()) {
      return this.currentState;
    }

    // Push current state to undo stack
    this.undoStack.push(this.currentState);
    
    // Pop from redo stack
    this.currentState = this.redoStack.pop();
    
    return this.currentState;
  }

  /**
   * Check if undo is available
   * @returns {boolean} True if there are items in the undo stack
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean} True if there are items in the redo stack
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get the current state
   * @returns {*} The current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get the size of the undo stack
   * @returns {number} Number of items in undo stack
   */
  getUndoStackSize() {
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   * @returns {number} Number of items in redo stack
   */
  getRedoStackSize() {
    return this.redoStack.length;
  }
}
