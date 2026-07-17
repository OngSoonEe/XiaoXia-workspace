<?php
/**
 * App_nini2 - Save Drawing API Endpoint
 * Accepts base64 encoded PNG image and saves it
 */

header('Content-Type: application/json');

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed'
    ]);
    exit;
}

// Get base64 image data
$imageData = isset($_POST['image']) ? $_POST['image'] : null;

// Check if data is present
if (!$imageData) {
    // Try to get from raw POST data
    $rawData = file_get_contents('php://input');
    if ($rawData) {
        $jsonData = json_decode($rawData, true);
        $imageData = $jsonData['image'] ?? null;
    }
}

if (!$imageData) {
    echo json_encode([
        'success' => false,
        'message' => 'No image data received'
    ]);
    exit;
}

// Validate base64 data
if (!preg_match('/^data:image\/png;base64,/', $imageData)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid image format. Only PNG allowed.'
    ]);
    exit;
}

// Remove data URI prefix
$imageData = str_replace('data:image/png;base64,', '', $imageData);

// Decode base64 data
$imageData = base64_decode($imageData);

if (!$imageData) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to decode image data'
    ]);
    exit;
}

// Create save directory if it doesn't exist
$saveDir = __DIR__ . '/../assets/images/saved';
if (!file_exists($saveDir)) {
    if (!mkdir($saveDir, 0755, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create save directory'
        ]);
        exit;
    }
}

// Generate unique filename
$filename = 'drawing-' . date('Y-m-d-H-i-s') . '-' . uniqid() . '.png';
$filepath = $saveDir . '/' . $filename;

// Save image
if (file_put_contents($filepath, $imageData)) {
    echo json_encode([
        'success' => true,
        'message' => 'Drawing saved successfully',
        'filename' => $filename,
        'filepath' => '/assets/images/saved/' . $filename
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save drawing'
    ]);
}
