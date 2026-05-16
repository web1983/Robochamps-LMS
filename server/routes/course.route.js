import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { 
  creatorCourse, 
  editCourse, 
  getCreatorCourses, 
  getPublishedCourses, 
  getLiveCourses, 
  getPublishedCoursesByCategory, 
  getLiveCoursesByCategory, 
  getCourseById, 
  togglePublishCourse, 
  toggleLiveCourse, 
  deleteCourse 
} from "../controllers/course.controller.js";
import upload from "../utils/multer.js";

const router = express.Router();

// Create course
router.route("/").post(isAuthenticated, creatorCourse);

// Get all courses for creator
router.route("/").get(isAuthenticated, getCreatorCourses);

// Get all published courses (public - for home page)
router.route("/published").get(getPublishedCourses);

// Get live courses (public - curated)
router.route("/live").get(getLiveCourses);

// Get published courses filtered by user category (authenticated students)
router.route("/published/filtered").get(isAuthenticated, getPublishedCoursesByCategory);

// Get live courses filtered by user category (authenticated students)
router.route("/live/filtered").get(isAuthenticated, getLiveCoursesByCategory);

// Get single course by ID (public - for course detail page)
router.route("/:courseId").get(getCourseById);

// Edit course
router.route("/:courseId").put(
  isAuthenticated,
  upload.single("courseThumbnail"),
  editCourse
);

// Delete course
router.route("/:courseId").delete(isAuthenticated, deleteCourse);

// Publish/Unpublish course
router.route("/:courseId/publish").patch(isAuthenticated, togglePublishCourse);

// Make course live / remove from live list
router.route("/:courseId/live").patch(isAuthenticated, toggleLiveCourse);

export default router;
