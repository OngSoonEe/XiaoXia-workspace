/**
 * App_nini2 - Gallery Manager
 * Fetches gallery data and renders thumbnails by category.
 */

class Gallery {
    constructor(onImageSelect) {
        this.onImageSelect = onImageSelect;
        this.galleryData = [];
        this.categories = ['all', 'animals', 'nature', 'vehicles', 'fantasy'];
        this.currentCategory = 'all';
    }

    async load(category = 'all') {
        this.currentCategory = category;
        
        try {
            const response = await fetch('api/gallery.php?category=' + category);
            const data = await response.json();
            
            if (data.success) {
                this.galleryData = data.images;
                this.render(this.galleryData);
            } else {
                this.renderError(data.message || 'Failed to load gallery');
            }
        } catch (error) {
            console.error('Gallery load error:', error);
            this.renderError('Failed to load gallery. Please try again.');
        }
    }

    render(images) {
        const galleryContainer = document.getElementById('gallery-container');
        
        if (!images || images.length === 0) {
            galleryContainer.innerHTML = '<div class="loading-msg">No images found in this category. Try another category!</div>';
            return;
        }
        
        let html = '';
        
        images.forEach(image => {
            html += `
                <div class="gallery-item" data-id="${image.id}">
                    <img src="${image.thumbnail}" alt="${image.name}" loading="lazy">
                    <div class="gallery-item-info">
                        <div class="gallery-item-name">${image.name}</div>
                        <div class="gallery-item-category">${this.formatCategory(image.category)}</div>
                    </div>
                </div>
            `;
        });
        
        galleryContainer.innerHTML = html;
        
        // Add click event listeners to gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const image = images.find(img => img.id === item.dataset.id);
                if (image) {
                    this.onImageSelect(image);
                }
            });
        });
    }

    renderError(message) {
        const galleryContainer = document.getElementById('gallery-container');
        galleryContainer.innerHTML = `<div class="loading-msg">${message}</div>`;
    }

    formatCategory(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    getCategoryImages(category) {
        if (category === 'all') {
            return this.galleryData;
        }
        return this.galleryData.filter(img => img.category === category);
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Gallery;
}
