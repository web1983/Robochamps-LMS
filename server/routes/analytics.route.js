import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getDashboardStats, getUserGrowthData, getAllStudentsMarks } from "../controllers/analytics.controller.js";

const router = express.Router();

// Get dashboard statistics
router.get("/stats", isAuthenticated, getDashboardStats);

// Get user growth data for charts
router.get("/user-growth", isAuthenticated, getUserGrowthData);

// Get all students marks
router.get("/students-marks", isAuthenticated, getAllStudentsMarks);

export default router;

