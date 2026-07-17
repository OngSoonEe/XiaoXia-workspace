/**
 * App_nini2 - Main Application Controller
 * Handles gallery initialization, tool selection, color selection,
 * brush size, undo/redo, clear, and save functionality.
 */

class App {
    constructor() {
        this.canvas = document.getElementById('coloring-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.galleryContainer = document.getElementById('gallery-container');
        
        // Current state
        this.currentTool = 'brush';
        this.currentColor = '#FF6B6B';
        this.brushSize = 5;
        this.selectedImage = null;
        this.currentCategory = 'all';
        
        // Initialize components
        this.undoManager = new UndoManager();
        this.colorPalette = new ColorPalette(this.handleColorSelect.bind(this));
        this.gallery = new Gallery(this.handleImageSelect.bind(this));
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadGallery();
        this.setupToolbar();
        this.setupColorPalette();
        
        console.log('App initialized successfully');
    }

    setupCanvas() {
        // Set canvas dimensions
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Initialize the canvas engine
        this.canvasEngine = new CanvasEngine(this.canvas, this.undoManager);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            
            if (this.selectedImage) {
                this.canvasEngine.redrawImage(this.selectedImage);
            }
        });
    }

    setupEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.canvasEngine.setTool(this.currentTool);
            });
        });
        
        // Brush size slider
        const brushSlider = document.getElementById('brush-size');
        const brushSizeDisplay = document.querySelector('.brush-size-display');
        
        brushSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeDisplay.textContent = `${this.brushSize}px`;
            this.canvasEngine.setBrushSize(this.brushSize);
        });
        
        // Action buttons
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });
        
        document.getElementById('redo-btn').addEventListener('click', () => {
            this.redo();
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCanvas();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveDrawing();
        });
        
        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.loadGallery(this.currentCategory);
            });
        });
    }

    setupToolbar() {
        console.log('Toolbar setup complete');
    }

    setupColorPalette() {
        console.log('Color palette setup complete');
    }

    loadGallery(category = 'all') {
        this.galleryContainer.innerHTML = '<div class="loading-msg">Loading gallery...</div>';
        this.gallery.load(category);
    }

    handleImageSelect(image) {
        this.selectedImage = image;
        this.canvasEngine.loadImage(image);
        
        // Switch to coloring section
        document.querySelector('.coloring-section').scrollIntoView({ behavior: 'smooth' });
    }

    handleColorSelect(color) {
        this.currentColor = color;
        this.canvasEngine.setColor(color);
    }

    undo() {
        this.undoManager.undo(this.canvasEngine);
    }

    redo() {
        this.undoManager.redo(this.canvasEngine);
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.canvasEngine.clear();
        }
    }

    saveDrawing() {
        const dataUrl = this.canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        
        fetch('api/save.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Data
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Drawing saved successfully!');
                // Show download link
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `drawing-${Date.now()}.png`;
                link.click();
            } else {
                alert('Failed to save drawing. Please try again.');
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            alert('An error occurred while saving. Please try again.');
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
