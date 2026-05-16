import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createSchoolCode,
  getSchoolCodes,
  updateSchoolCode,
  deleteSchoolCode,
} from "../controllers/schoolCode.controller.js";

const router = express.Router();

router
  .route("/")
  .get(isAuthenticated, getSchoolCodes)
  .post(isAuthenticated, createSchoolCode);

router
  .route("/:id")
  .patch(isAuthenticated, updateSchoolCode)
  .delete(isAuthenticated, deleteSchoolCode);

export default router;

