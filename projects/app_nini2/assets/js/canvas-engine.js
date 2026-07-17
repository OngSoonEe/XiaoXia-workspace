/**
 * App_nini2 - Canvas Engine
 * Handles 3-layer canvas (lineArtLayer, paintLayer, cursorLayer)
 * Brush painting with smooth strokes, touch event handling, and eraser tool.
 */

class CanvasEngine {
    constructor(canvas, undoManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.undoManager = undoManager;
        
        // Create three layers using off-screen canvases
        this.lineArtCanvas = document.createElement('canvas');
        this.lineArtCanvas.width = canvas.width;
        this.lineArtCanvas.height = canvas.height;
        this.lineArtCtx = this.lineArtCanvas.getContext('2d');
        
        this.paintCanvas = document.createElement('canvas');
        this.paintCanvas.width = canvas.width;
        this.paintCanvas.height = canvas.height;
        this.paintCtx = this.paintCanvas.getContext('2d');
        
        this.cursorCanvas = document.createElement('canvas');
        this.cursorCanvas.width = canvas.width;
        this.cursorCanvas.height = canvas.height;
        this.cursorCtx = this.cursorCanvas.getContext('2d');
        
        // Current settings
        this.currentTool = 'brush';
        this.currentColor = '#FF6B6B';
        this.brushSize = 5;
        
        // Drawing state
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Load current image
        this.currentImage = null;
        
        this.setupEventListeners();
        this.setupLayeredCanvas();
    }

    setupLayeredCanvas() {
        // Draw line art layer (background)
        this.ctx.drawImage(this.lineArtCanvas, 0, 0);
        
        // Draw paint layer (foreground)
        this.ctx.drawImage(this.paintCanvas, 0, 0);
        
        // Draw cursor layer (overlay)
        this.ctx.drawImage(this.cursorCanvas, 0, 0);
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleStartDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.handleDraw.bind(this));
        this.canvas.addEventListener('mouseup', this.handleStopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleStopDrawing.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleStopDrawing.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleStopDrawing.bind(this));
        
        // Clear cursor on mouse leave
        this.canvas.addEventListener('mouseleave', () => {
            this.clearCursorLayer();
        });
    }

    handleStartDrawing(e) {
        this.isDrawing = true;
        const { x, y } = this.getCoordinates(e);
        this.lastX = x;
        this.lastY = y;
        
        this.drawAt(x, y);
        
        // Start saving state for undo - we'll save when drawing stops
        this.undoManager.startState();
    }

    handleDraw(e) {
        if (!this.isDrawing) return;
        
        const { x, y } = this.getCoordinates(e);
        
        // Draw smooth curve
        this.drawCurve(this.lastX, this.lastY, x, y);
        
        this.lastX = x;
        this.lastY = y;
        
        // Update cursor
        this.updateCursor(x, y);
    }

    handleStopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveCurrentState();
            this.clearCursorLayer();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const { x, y } = this.getCoordinates(touch);
        this.lastX = x;
        this.lastY = y;
        this.isDrawing = true;
        
        this.drawAt(x, y);
        this.undoManager.startState();
    }

    handleTouchMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const { x, y } = this.getCoordinates(touch);
        this.drawCurve(this.lastX, this.lastY, x, y);
        
        this.lastX = x;
        this.lastY = y;
        
        this.updateCursor(x, y);
    }

    getCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    drawAt(x, y) {
        if (this.currentTool === 'eraser') {
            this.eraseAt(x, y);
        } else {
            this.paintAt(x, y);
        }
    }

    paintAt(x, y) {
        this.paintCtx.beginPath();
        this.paintCtx.arc(x, y, this.brushSize, 0, Math.PI * 2);
        this.paintCtx.fillStyle = this.currentColor;
        this.paintCtx.fill();
    }

    eraseAt(x, y) {
        this.paintCtx.beginPath();
        this.paintCtx.arc(x, y, this.brushSize, 0, Math.PI * 2);
        this.paintCtx.fillStyle = 'rgba(0,0,0,0)'; // Transparent
        this.paintCtx.globalCompositeOperation = 'destination-out';
        this.paintCtx.fill();
        this.paintCtx.globalCompositeOperation = 'source-over';
    }

    drawCurve(x1, y1, x2, y2) {
        if (this.currentTool === 'eraser') {
            this.eraseAt(x2, y2);
            // Also erase around the line for smoother erasing
            this.eraseAt((x1 + x2) / 2, (y1 + y2) / 2);
        } else {
            this.paintCtx.beginPath();
            this.paintCtx.moveTo(x1, y1);
            this.paintCtx.lineTo(x2, y2);
            this.paintCtx.lineCap = 'round';
            this.paintCtx.lineJoin = 'round';
            this.paintCtx.strokeStyle = this.currentColor;
            this.paintCtx.lineWidth = this.brushSize;
            this.paintCtx.stroke();
        }
    }

    updateCursor(x, y) {
        this.cursorCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw brush cursor
        this.cursorCtx.beginPath();
        this.cursorCtx.arc(x, y, this.brushSize, 0, Math.PI * 2);
        this.cursorCtx.strokeStyle = this.currentColor;
        this.cursorCtx.lineWidth = 1;
        this.cursorCtx.stroke();
        
        // Draw center dot for precision
        this.cursorCtx.beginPath();
        this.cursorCtx.arc(x, y, 2, 0, Math.PI * 2);
        this.cursorCtx.fillStyle = '#000';
        this.cursorCtx.fill();
    }

    clearCursorLayer() {
        this.cursorCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    saveCurrentState() {
        const imageData = this.paintCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.undoManager.push(imageData);
        
        // Clear paint layer after saving state
        this.paintCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Redraw layers
        this.redrawAllLayers();
    }

    redrawAllLayers() {
        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Redraw line art
        this.ctx.drawImage(this.lineArtCanvas, 0, 0);
        
        // Redraw paint layer
        this.ctx.drawImage(this.paintCanvas, 0, 0);
        
        // Redraw cursor layer
        this.ctx.drawImage(this.cursorCanvas, 0, 0);
    }

    clear() {
        this.undoManager.clearRedo();
        this.paintCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.redrawAllLayers();
    }

    redrawImage(image) {
        this.clear();
        this.loadImage(image);
    }

    loadImage(image) {
        this.currentImage = image;
        
        // Load line art SVG
        const lineArtImg = new Image();
        lineArtImg.onload = () => {
            this.lineArtCtx.drawImage(lineArtImg, 0, 0, this.canvas.width, this.canvas.height);
            this.redrawAllLayers();
        };
        lineArtImg.onerror = () => {
            console.error('Failed to load line art:', image.url);
            // Show placeholder
            this.lineArtCtx.fillStyle = '#f0f0f0';
            this.lineArtCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.lineArtCtx.fillStyle = '#999';
            this.lineArtCtx.font = '20px Arial';
            this.lineArtCtx.textAlign = 'center';
            this.lineArtCtx.fillText('Image not available', this.canvas.width / 2, this.canvas.height / 2);
            this.redrawAllLayers();
        };
        lineArtImg.src = image.url;
    }

    setTool(tool) {
        this.currentTool = tool;
    }

    setColor(color) {
        this.currentColor = color;
    }

    setBrushSize(size) {
        this.brushSize = size;
    }

    // Add these helper methods
    drawAt(x, y) {
        if (this.currentTool === 'eraser') {
            this.eraseAt(x, y);
        } else {
            this.paintAt(x, y);
        }
    }
}
