import { Settings } from "../models/settings.model.js";
import { deleteMediaFromCloudinary, uploadMedia, extractPublicId } from "../utils/cloudinary.js";

// Get app settings (public - no auth required)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ settingsId: "app-settings" });
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await Settings.create({
        settingsId: "app-settings",
        companyName: "",
        logoUrl: "",
        siteTitle: "",
        siteDescription: "",
        siteThumbnail: "",
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get settings",
      error: error.message,
    });
  }
};

// Update app settings (admin only)
export const updateSettings = async (req, res) => {
  try {
    const { companyName, siteTitle, siteDescription } = req.body;
    const logoFile = req.files?.logo?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    let settings = await Settings.findOne({ settingsId: "app-settings" });
    
    // If no settings exist, create them
    if (!settings) {
      settings = await Settings.create({
        settingsId: "app-settings",
        companyName: companyName || "",
        logoUrl: "",
        siteTitle: siteTitle || "",
        siteDescription: siteDescription || "",
        siteThumbnail: "",
      });
    }

    // Update company name (can be empty)
    if (companyName !== undefined) {
      settings.companyName = companyName;
    }

    // Update site title
    if (siteTitle !== undefined) {
      settings.siteTitle = siteTitle;
    }

    // Update site description
    if (siteDescription !== undefined) {
      settings.siteDescription = siteDescription;
    }

    // Update logo if provided
    if (logoFile) {
      // Delete old logo from cloudinary if it exists
      if (settings.logoUrl) {
        try {
          const publicId = extractPublicId(settings.logoUrl);
          if (publicId) {
            await deleteMediaFromCloudinary(publicId);
            console.log("Old logo deleted:", publicId);
          }
        } catch (err) {
          console.warn("Failed to delete old logo:", err.message);
        }
      }

      // Upload new logo (use buffer for serverless, path for local)
      const cloudResponse = await uploadMedia(logoFile.buffer || logoFile.path);
      settings.logoUrl = cloudResponse.secure_url;
    }

    // Update site thumbnail if provided
    if (thumbnailFile) {
      // Delete old thumbnail from cloudinary if it exists
      if (settings.siteThumbnail) {
        try {
          const publicId = extractPublicId(settings.siteThumbnail);
          if (publicId) {
            await deleteMediaFromCloudinary(publicId);
            console.log("Old site thumbnail deleted:", publicId);
          }
        } catch (err) {
          console.warn("Failed to delete old site thumbnail:", err.message);
        }
      }

      // Upload new thumbnail (use buffer for serverless, path for local)
      const cloudResponse = await uploadMedia(thumbnailFile.buffer || thumbnailFile.path);
      settings.siteThumbnail = cloudResponse.secure_url;
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

