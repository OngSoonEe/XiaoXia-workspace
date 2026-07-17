<?php
/**
 * App_nini2 - Gallery API Endpoint
 * Returns gallery images based on category
 */

header('Content-Type: application/json');

// Read gallery JSON file
$galleryFile = __DIR__ . '/../assets/images/gallery.json';

if (!file_exists($galleryFile)) {
    echo json_encode([
        'success' => false,
        'message' => 'Gallery file not found'
    ]);
    exit;
}

// Get category parameter
$category = isset($_GET['category']) ? $_GET['category'] : 'all';

// Read and decode gallery JSON
$galleryData = json_decode(file_get_contents($galleryFile), true);

if (!isset($galleryData['images'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid gallery data'
    ]);
    exit;
}

// Filter by category if specified
if ($category !== 'all') {
    $filteredImages = array_filter($galleryData['images'], function($image) use ($category) {
        return $image['category'] === $category;
    });
    
    // Re-index array after filtering
    $filteredImages = array_values($filteredImages);
    
    echo json_encode([
        'success' => true,
        'category' => $category,
        'count' => count($filteredImages),
        'images' => $filteredImages
    ]);
} else {
    echo json_encode([
        'success' => true,
        'category' => 'all',
        'count' => count($galleryData['images']),
        'images' => $galleryData['images']
    ]);
}
