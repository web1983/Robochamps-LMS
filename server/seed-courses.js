/**
 * Add sample published + live courses (new empty database).
 * Run: npm run seed:courses
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB, { buildMongoUri } from "./database/db.js";
import { Course } from "./models/course.model.js";
import User from "./models/user.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const CATEGORIES = [
  "grade_3_5_basic",
  "grade_6_8_basic",
  "grade_9_12_basic",
  "grade_3_5_advance",
  "grade_6_8_advance",
  "grade_9_12_advance",
];

const SAMPLE = [
  {
    courseTitle: "Introduction to Robotics",
    subTitle: "Build your first robot",
    description: "Learn basics of motors, sensors, and simple builds.",
    videoUrl: "https://www.youtube.com/watch?v=mZDfDWhJIIQ",
    courseThumbnail:
      "https://img.youtube.com/vi/mZDfDWhJIIQ/hqdefault.jpg",
    courseLevel: "Beginner",
  },
  {
    courseTitle: "Programming Your Robot",
    subTitle: "Block coding and logic",
    description: "Control movement with simple programs.",
    videoUrl: "https://www.youtube.com/watch?v=41NOblWzBAc",
    courseThumbnail:
      "https://img.youtube.com/vi/41NOblWzBAc/hqdefault.jpg",
    courseLevel: "Medium",
  },
];

if (!buildMongoUri()) {
  console.error("Fix MONGO_URI in server/.env first.");
  process.exit(1);
}

await connectDB();

const instructor =
  (await User.findOne({ email: "web@robowunder.com" })) ||
  (await User.findOne({ role: "instructor" }));

if (!instructor) {
  console.error("No instructor found. Run: npm run seed:local");
  process.exit(1);
}

let created = 0;
for (const category of CATEGORIES) {
  for (const sample of SAMPLE) {
    const exists = await Course.findOne({
      courseTitle: sample.courseTitle,
      category,
    });
    if (exists) continue;

    await Course.create({
      ...sample,
      category,
      creator: instructor._id,
      isPublished: true,
      isLive: true,
    });
    created += 1;
  }
}

const total = await Course.countDocuments({
  isPublished: true,
  isLive: true,
});
console.log(`Created ${created} course(s). Total published+live: ${total}`);
console.log("Students on grade_3_5_basic should now see 2 videos on the home page.");
process.exit(0);
