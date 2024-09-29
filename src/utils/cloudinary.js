import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // console.log("Attempting upload for file:", localFilePath); // Log file path
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("File uploaded on Cloudinary:", response.url); // Log success

        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.error("Cloudinary upload failed:", error); // Log error details
        fs.unlinkSync(localFilePath);  // Remove file if error occurs
        return null;
    }
}




export {uploadOnCloudinary}