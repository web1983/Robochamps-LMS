import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";
dotenv.config({});

cloudinary.config({
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

export const uploadMedia = async (file) => {
    try {
        // Handle both file path (local) and buffer (serverless)
        let uploadSource = file;
        
        // If file is a buffer (from multer memory storage), convert to base64
        if (Buffer.isBuffer(file)) {
            uploadSource = `data:application/octet-stream;base64,${file.toString('base64')}`;
        }
        
        const uploadResponse = await cloudinary.uploader.upload(uploadSource, {
            resource_type: "auto"
        });
        return uploadResponse;
    } catch (error) {
        console.log("Cloudinary upload error:", error);
        throw error;
    }
};

export const deleteMediaFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.log(error);
    }
};

export const deleteVideoFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId,{resource_type:"video"})
    } catch (error) {
        console.log(error)
    }
};

// Extract public_id from Cloudinary URL
export const extractPublicId = (url) => {
    try {
        if (!url) return null;
        
        // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/public_id.jpg
        // or: https://res.cloudinary.com/cloud_name/image/upload/folder/public_id.jpg
        
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        
        // Get everything after 'upload/'
        let publicIdWithExtension = parts[1];
        
        // Remove version number if present (v1234567890/)
        publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');
        
        // Remove file extension
        const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            return publicIdWithExtension.substring(0, lastDotIndex);
        }
        
        return publicIdWithExtension;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};