/**
 * App_nini2 - Undo Manager
 * Manages undo/redo state stack for canvas operations.
 * Stores ImageData objects with max 50 states.
 */

class UndoManager {
    constructor(maxStates = 50) {
        this.maxStates = maxStates;
        this.undoStack = [];
        this.redoStack = [];
        this.isStartingState = false;
    }

    /**
     * Start a new state - called when user begins drawing
     */
    startState() {
        this.isStartingState = true;
    }

    /**
     * Push current state to undo stack
     * @param {ImageData} imageData - Current canvas state
     */
    push(imageData) {
        if (this.isStartingState) {
            this.isStartingState = false;
            return;
        }
        
        // Add to undo stack
        this.undoStack.push(imageData);
        
        // Limit undo stack size
        if (this.undoStack.length > this.maxStates) {
            this.undoStack.shift(); // Remove oldest state
        }
        
        // Clear redo stack when new action is taken
        this.redoStack = [];
    }

    /**
     * Undo last action
     * @param {CanvasEngine} canvasEngine - Canvas engine instance
     */
    undo(canvasEngine) {
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return;
        }
        
        // Move current state to redo stack
        const imageData = this.undoStack.pop();
        this.redoStack.push(imageData);
        
        // Get previous state and restore it
        if (this.undoStack.length > 0) {
            const previousImage = this.undoStack[this.undoStack.length - 1];
            
            // Create a temporary canvas to restore the image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasEngine.canvas.width;
            tempCanvas.height = canvasEngine.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.putImageData(previousImage, 0, 0);
            
            // Clear current paint layer and redraw
            canvasEngine.paintCtx.clearRect(0, 0, canvasEngine.canvas.width, canvasEngine.canvas.height);
            canvasEngine.paintCtx.drawImage(tempCanvas, 0, 0);
            
            // Redraw all layers
            canvasEngine.redrawAllLayers();
        }
    }

    /**
     * Redo last undone action
     * @param {CanvasEngine} canvasEngine - Canvas engine instance
     */
    redo(canvasEngine) {
        if (this.redoStack.length === 0) {
            console.log('Nothing to redo');
            return;
        }
        
        // Move state from redo to undo stack
        const imageData = this.redoStack.pop();
        this.undoStack.push(imageData);
        
        // Restore state
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasEngine.canvas.width;
        tempCanvas.height = canvasEngine.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.putImageData(imageData, 0, 0);
        
        // Clear current paint layer and redraw
        canvasEngine.paintCtx.clearRect(0, 0, canvasEngine.canvas.width, canvasEngine.canvas.height);
        canvasEngine.paintCtx.drawImage(tempCanvas, 0, 0);
        
        // Redraw all layers
        canvasEngine.redrawAllLayers();
    }

    /**
     * Clear redo stack (called when new action is made)
     */
    clearRedo() {
        this.redoStack = [];
    }

    /**
     * Check if at latest state
     * @returns {boolean} - True if at latest state
     */
    isAtLatest() {
        return this.redoStack.length === 0;
    }

    /**
     * Get current undo/redo state counts
     * @returns {Object} - Object with undoCount and redoCount
     */
    getStateCounts() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length
        };
    }

    /**
     * Reset the undo manager
     */
    reset() {
        this.undoStack = [];
        this.redoStack = [];
        this.isStartingState = false;
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UndoManager;
}
