import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Strict allowlist of MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp'
];

// Strict allowlist of file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.memoryStorage();

export const avatarUpload = multer({
  storage,
  limits: { 
    fileSize: 2 * 1024 * 1024, // Reduced to 2MB for better security
    files: 1, // Only allow single file upload
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // Limit field value size
  },
  fileFilter: (req, file, cb) => {
    try {
      // Check MIME type against strict allowlist
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
      }
      
      // Check file extension against strict allowlist
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed.'));
      }
      
      // Sanitize and randomize filename to prevent path traversal
      const randomName = crypto.randomUUID();
      file.originalname = randomName + ext;
      
      // Additional security check - ensure originalname doesn't contain path characters
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        return cb(new Error('Invalid filename detected.'));
      }
      
      cb(null, true);
    } catch (error) {
      cb(new Error('File validation error'));
    }
  },
});

// Middleware for uploading post images (supports multiple files)
export const postImagesUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    try {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
      }

      // Validate extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed.'));
      }

      // Randomize filename
      const randomName = crypto.randomUUID();
      file.originalname = randomName + ext;

      // Additional security
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        return cb(new Error('Invalid filename detected.'));
      }

      cb(null, true);
    } catch (error) {
      cb(new Error('File validation error'));
    }
  }
}); 