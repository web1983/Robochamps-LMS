import multer from "multer";

// Use memory storage for Vercel serverless (no file system access)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

export default upload;


