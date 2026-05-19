/**
 * Remove sample courses created by seed-courses.js (YouTube placeholder videos).
 * Run: node remove-seed-courses.js
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB, { buildMongoUri } from "./database/db.js";
import { Course } from "./models/course.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const SEED_VIDEO_URLS = [
  "https://www.youtube.com/watch?v=mZDfDWhJIIQ",
  "https://www.youtube.com/watch?v=41NOblWzBAc",
];

if (!buildMongoUri()) {
  console.error("Fix MONGO_URI in server/.env first.");
  process.exit(1);
}

await connectDB();

const result = await Course.deleteMany({
  videoUrl: { $in: SEED_VIDEO_URLS },
});

console.log(`Removed ${result.deletedCount} sample course(s).`);

const visible = await Course.countDocuments({
  isPublished: true,
  isLive: true,
});
console.log(`Published + live courses remaining: ${visible}`);
process.exit(0);
