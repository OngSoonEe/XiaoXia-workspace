<?php
/**
 * App_nini2 - Kids Coloring Book App
 * Single Page Application Entry Point
 */

$siteTitle = "App_nini2 - Kids Coloring Book";
$metaDesc = "A fun coloring book app for kids with animals, nature, vehicles, and fantasy images.";
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($siteTitle) ?></title>
    <meta name="description" content="<?= htmlspecialchars($metaDesc) ?>">
    
    <!-- CSS Styles -->
    <link rel="stylesheet" href="assets/css/style.css">
    
    <!-- Google Fonts for kid-friendly typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <h1 class="logo">
            <span class="logo-icon">🎨</span>
            <span class="logo-text">App_nini2</span>
        </h1>
        <nav class="nav">
            <a href="#gallery" class="nav-link gallery-link">Gallery</a>
            <a href="#about" class="nav-link">About</a>
        </nav>
    </header>

    <main class="main">
        <!-- Gallery Section -->
        <section id="gallery" class="gallery-section">
            <h2 class="section-title">Choose a Picture to Color</h2>
            
            <div class="filter-buttons">
                <button class="filter-btn active" data-category="all">All</button>
                <button class="filter-btn" data-category="animals">Animals</button>
                <button class="filter-btn" data-category="nature">Nature</button>
                <button class="filter-btn" data-category="vehicles">Vehicles</button>
                <button class="filter-btn" data-category="fantasy">Fantasy</button>
            </div>
            
            <div id="gallery-container" class="gallery-grid">
                <!-- Gallery items will be loaded here via JavaScript -->
                <div class="loading-msg">Loading gallery...</div>
            </div>
        </section>

        <!-- Coloring Section -->
        <section id="coloring" class="coloring-section">
            <div class="coloring-container">
                <canvas id="coloring-canvas" class="coloring-canvas"></canvas>
                
                <!-- Tools Toolbar -->
                <div class="toolbar">
                    <div class="tool-section">
                        <button class="tool-btn active" data-tool="brush" aria-label="Brush Tool">
                            <span class="tool-icon">🖌️</span>
                            <span class="tool-label">Brush</span>
                        </button>
                        <button class="tool-btn" data-tool="eraser" aria-label="Eraser Tool">
                            <span class="tool-icon">🧹</span>
                            <span class="tool-label">Eraser</span>
                        </button>
                    </div>
                    
                    <div class="tool-section">
                        <input type="range" id="brush-size" min="1" max="50" value="5" class="brush-slider">
                        <span class="brush-size-display">5px</span>
                    </div>
                    
                    <div class="tool-section undo-redo">
                        <button class="action-btn" id="undo-btn" aria-label="Undo">
                            <span class="action-icon">↩️</span>
                            <span class="action-label">Undo</span>
                        </button>
                        <button class="action-btn" id="redo-btn" aria-label="Redo">
                            <span class="action-icon">↪️</span>
                            <span class="action-label">Redo</span>
                        </button>
                    </div>
                    
                    <div class="tool-section">
                        <button class="action-btn" id="clear-btn" aria-label="Clear Canvas">
                            <span class="action-icon">🗑️</span>
                            <span class="action-label">Clear</span>
                        </button>
                        <button class="action-btn primary" id="save-btn" aria-label="Save Drawing">
                            <span class="action-icon">💾</span>
                            <span class="action-label">Save</span>
                        </button>
                    </div>
                </div>

                <!-- Color Palette -->
                <div class="color-palette">
                    <div class="palette-header">
                        <span class="palette-title">Colors</span>
                        <span class="selected-color-preview" id="selected-color-preview"></span>
                    </div>
                    <div class="palette-grid" id="palette-grid">
                        <!-- Color swatches will be loaded here via JavaScript -->
                    </div>
                    <div class="custom-color-picker">
                        <input type="color" id="custom-color" class="custom-color-input">
                        <span class="recent-colors-label">Recent</span>
                        <div class="recent-colors" id="recent-colors">
                            <!-- Recent colors will appear here -->
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer-content">
            <p>© 2026 App_nini2. A fun coloring book for kids!</p>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="assets/js/undo-manager.js"></script>
    <script src="assets/js/canvas-engine.js"></script>
    <script src="assets/js/color-palette.js"></script>
    <script src="assets/js/gallery.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
