/**
 * App_nini2 - Color Palette Manager
 * Manages color selection, custom color picker, and recent colors.
 */

class ColorPalette {
    constructor(onColorSelect) {
        this.onColorSelect = onColorSelect;
        this.selectedColor = '#FF6B6B';
        this.recentColors = [];
        this.maxRecentColors = 8;
        
        this.paletteGrid = document.getElementById('palette-grid');
        this.customColorInput = document.getElementById('custom-color');
        this.recentColorsContainer = document.getElementById('recent-colors');
        this.selectedColorPreview = document.getElementById('selected-color-preview');
        
        this.init();
    }

    init() {
        this.setupPresetColors();
        this.setupCustomColorPicker();
        this.setupRecentColors();
        this.updateColorPreview();
    }

    setupPresetColors() {
        // 24+ preset colors
        const presetColors = [
            '#FF6B6B', '#FF8E8E', '#FFB38E', '#FFD98E', '#FFE68E', '#FFFF8E', 
            '#D9FF8E', '#B3FF8E', '#8EFFB3', '#8EFFFF', '#8ED9FF', '#8EB3FF',
            '#B38EFF', '#FF8EFC', '#FF8E8E', '#FF6B6B', '#8E8EFF', '#B38EFF',
            '#FF8EB3', '#FFB3B3', '#FFD9D9', '#D9FFD9', '#B3FFD9', '#8EFFD9',
            '#FF8ED9', '#FFB3D9', '#FFD9B3', '#FFFFB3', '#D9FFB3', '#B3FFB3'
        ];
        
        let html = '';
        presetColors.forEach((color, index) => {
            html += `
                <div class="color-swatch" data-color="${color}" style="background-color: ${color};"
                     title="${color}">
                </div>
            `;
        });
        
        this.paletteGrid.innerHTML = html;
        
        // Add click event listeners
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.selectColor(swatch.dataset.color);
            });
        });
    }

    setupCustomColorPicker() {
        this.customColorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            this.selectColor(color);
            this.addRecentColor(color);
        });
    }

    setupRecentColors() {
        this.updateRecentColors();
    }

    selectColor(color) {
        this.selectedColor = color;
        
        // Update UI
        this.updateColorPreview();
        this.highlightSelectedColor(color);
        
        // Call callback
        this.onColorSelect(color);
        
        // Add to recent colors
        this.addRecentColor(color);
    }

    updateColorPreview() {
        this.selectedColorPreview.style.backgroundColor = this.selectedColor;
        this.customColorInput.value = this.selectedColor;
    }

    highlightSelectedColor(color) {
        // Remove active class from all swatches
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('active');
        });
        
        // Add active class to selected color
        const activeSwatch = this.paletteGrid.querySelector(`[data-color="${color}"]`);
        if (activeSwatch) {
            activeSwatch.classList.add('active');
        }
    }

    addRecentColor(color) {
        // Remove if already in recent colors
        this.recentColors = this.recentColors.filter(c => c !== color);
        
        // Add to beginning of array
        this.recentColors.unshift(color);
        
        // Limit to maxRecentColors
        if (this.recentColors.length > this.maxRecentColors) {
            this.recentColors = this.recentColors.slice(0, this.maxRecentColors);
        }
        
        this.updateRecentColors();
    }

    updateRecentColors() {
        let html = '';
        this.recentColors.forEach(color => {
            html += `
                <div class="recent-color-swatch" style="background-color: ${color};"
                     title="${color}" data-color="${color}">
                </div>
            `;
        });
        
        this.recentColorsContainer.innerHTML = html;
        
        // Add click event listeners to recent colors
        document.querySelectorAll('.recent-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.selectColor(swatch.dataset.color);
            });
        });
    }

    // Add these helper methods for the ColorPalette class
    selectColor(color) {
        this.selectedColor = color;
        
        // Update UI
        this.updateColorPreview();
        this.highlightSelectedColor(color);
        
        // Call callback
        this.onColorSelect(color);
        
        // Add to recent colors
        this.addRecentColor(color);
    }

    updateColorPreview() {
        this.selectedColorPreview.style.backgroundColor = this.selectedColor;
        this.customColorInput.value = this.selectedColor;
    }

    highlightSelectedColor(color) {
        // Remove active class from all swatches
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('active');
        });
        
        // Add active class to selected color
        const activeSwatch = this.paletteGrid.querySelector(`[data-color="${color}"]`);
        if (activeSwatch) {
            activeSwatch.classList.add('active');
        }
    }

    addRecentColor(color) {
        // Remove if already in recent colors
        this.recentColors = this.recentColors.filter(c => c !== color);
        
        // Add to beginning of array
        this.recentColors.unshift(color);
        
        // Limit to maxRecentColors
        if (this.recentColors.length > this.maxRecentColors) {
            this.recentColors = this.recentColors.slice(0, this.maxRecentColors);
        }
        
        this.updateRecentColors();
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorPalette;
}
