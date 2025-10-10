// Multer configuration for file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const imagesDir = path.join(uploadsDir, 'images');

[uploadsDir, videosDir, imagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on file type
        if (file.mimetype.startsWith('video/')) {
            cb(null, videosDir);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, imagesDir);
        } else {
            cb(new Error('Invalid file type'), null);
        }
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.fieldname === 'videoFile') {
        if (allowedVideoTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid video format. Only MP4, WebM, and OGG are allowed.'), false);
        }
    } else if (file.fieldname === 'posterImage' || file.fieldname === 'backdropImage') {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
        }
    } else {
        cb(null, true);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
        files: 3 // Max 3 files (poster, backdrop, video)
    }
});

// Middleware for handling content upload
const contentUpload = upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'posterImage', maxCount: 1 },
    { name: 'backdropImage', maxCount: 1 }
]);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: 'Maximum file size is 500MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files',
                message: 'Maximum 3 files allowed'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'Upload error',
            message: err.message
        });
    } else if (err) {
        // Other errors
        return res.status(400).json({
            success: false,
            error: 'Upload failed',
            message: err.message
        });
    }
    next();
};

module.exports = {
    contentUpload,
    handleUploadError,
    uploadsDir,
    videosDir,
    imagesDir
};
