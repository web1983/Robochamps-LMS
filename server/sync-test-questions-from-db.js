/**
 * Copy testQuestions, testTimeLimit, and videoUrl from Robowunder LMS DB → Robochamps LMS DB.
 * Courses are matched by courseTitle + category.
 *
 * Setup in server/.env:
 *   SOURCE_MONGO_URI=mongodb+srv://...   (Robowunder / lms.robowunder.com database)
 *   MONGO_URI=mongodb+srv://...        (Robochamps database)
 *
 * Run: node sync-test-questions-from-db.js
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Course } from "./models/course.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const SOURCE_URI = process.env.SOURCE_MONGO_URI;
const TARGET_URI = process.env.MONGO_URI;

if (!SOURCE_URI || !TARGET_URI) {
  console.error("❌ Set SOURCE_MONGO_URI (Robowunder) and MONGO_URI (Robochamps) in server/.env");
  process.exit(1);
}

const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();

const SourceCourse = sourceConn.model("Course", Course.schema);
const TargetCourse = targetConn.model("Course", Course.schema);

const sourceCourses = await SourceCourse.find({
  testQuestions: { $exists: true, $ne: [] },
}).select("courseTitle category testQuestions testTimeLimit videoUrl");

const withQuestions = sourceCourses.filter(
  (c) => Array.isArray(c.testQuestions) && c.testQuestions.length > 0
);

console.log(`📚 Found ${withQuestions.length} courses with test questions in source DB`);

let updated = 0;
let missing = 0;

for (const src of withQuestions) {
  const target = await TargetCourse.findOne({
    courseTitle: src.courseTitle,
    category: src.category,
  });

  if (!target) {
    console.log(`⚠️  No match: "${src.courseTitle}" (${src.category})`);
    missing += 1;
    continue;
  }

  target.testQuestions = JSON.parse(JSON.stringify(src.testQuestions));
  if (src.testTimeLimit) target.testTimeLimit = src.testTimeLimit;
  if (src.videoUrl) target.videoUrl = src.videoUrl;
  await target.save();

  console.log(
    `✅ ${target.courseTitle} (${target.category}): ${src.testQuestions.length} questions`
  );
  updated += 1;
}

console.log(`\nDone. Updated: ${updated}, not found in target: ${missing}`);

await sourceConn.close();
await targetConn.close();
process.exit(0);
