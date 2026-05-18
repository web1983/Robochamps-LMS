/**
 * Mark all published courses as live (fixes migrated data where isLive was false).
 * Run: node enable-live-published-courses.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Course } from "./models/course.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const result = await Course.updateMany(
  { isPublished: true, isLive: { $ne: true } },
  { $set: { isLive: true } }
);

console.log(`Updated ${result.modifiedCount} course(s) to isLive=true (were published but not live).`);
await mongoose.disconnect();
