import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import upload from "../utils/multer.js";

const router = express.Router();

// Get settings (public - no auth required)
router.get("/", getSettings);

// Update settings (admin only) - supports multiple file uploads (logo and thumbnail)
router.put("/", isAuthenticated, upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]), updateSettings);

export default router;

