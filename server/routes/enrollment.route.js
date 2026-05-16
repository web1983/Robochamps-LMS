import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  enrollCourse,
  getEnrollmentStatus,
  markVideoWatched,
  submitTest,
  getTestQuestions,
  getMyEnrollments,
  getCertificateStatus,
} from "../controllers/enrollment.controller.js";

const router = express.Router();

// Get user's enrolled courses
router.get("/my-enrollments", isAuthenticated, getMyEnrollments);

// Get certificate status
router.get("/certificate-status", isAuthenticated, getCertificateStatus);

// Enroll in course
router.post("/:courseId/enroll", isAuthenticated, enrollCourse);

// Get enrollment status
router.get("/:courseId/status", isAuthenticated, getEnrollmentStatus);

// Mark video as watched
router.patch("/:courseId/video-watched", isAuthenticated, markVideoWatched);

// Get test questions
router.get("/:courseId/test", isAuthenticated, getTestQuestions);

// Submit test
router.post("/:courseId/test/submit", isAuthenticated, submitTest);

export default router;

