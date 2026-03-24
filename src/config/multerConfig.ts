import multer, { Multer } from 'multer';
import path from 'path';
import fs from 'fs';

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/img/candidate_profiles');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with proper extension
        const ext = path.extname(file.originalname);

        // Ensure we have an extension
        if (!ext) {
            return cb(new Error('File must have an extension'), '');
        }

        const name = path.basename(file.originalname, ext);
        cb(null, `${name}${ext}`);
    }
});

// Create the multer instance
const upload: Multer = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Define allowed file types
        const allowedImageTypes = /jpeg|jpg|png/;
        const allowedDataTypes = /xls|xlsx|csv/;
        const allAllowedTypes = /jpeg|jpg|png|xls|xlsx|csv/;

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        const hasValidExtension = allAllowedTypes.test(ext.substring(1)); // Remove the dot

        // Check MIME type
        const hasValidMimeType = (
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/png' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'text/csv'
        );

        if (hasValidExtension && hasValidMimeType) {
            return cb(null, true);
        }

        cb(new Error(`Invalid file type. Only ${allAllowedTypes} files are allowed. Received: ${file.mimetype}`));
    }
});

export default upload;