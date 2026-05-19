/**
 * First-time local setup for a new empty MongoDB cluster.
 * Run: npm run seed:local
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import connectDB, { buildMongoUri } from "./database/db.js";
import User from "./models/user.model.js";
import SchoolCode from "./models/schoolCode.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

if (!buildMongoUri()) {
  console.error("Fix MONGO_URI in server/.env first, then run: npm run test:db");
  process.exit(1);
}

await connectDB();

const schoolCode = "DEMO2024";
const instructorEmail = "admin@robochamps.local";
const instructorPassword = "admin123";

let code = await SchoolCode.findOne({ code: schoolCode });
if (!code) {
  code = await SchoolCode.create({
    code: schoolCode,
    schoolName: "Demo School",
    limit: 100,
    usedCount: 0,
    isActive: true,
  });
  console.log("Created school code:", schoolCode);
} else {
  console.log("School code already exists:", schoolCode);
}

let instructor = await User.findOne({ email: instructorEmail });
if (!instructor) {
  const hashed = await bcrypt.hash(instructorPassword, 10);
  instructor = await User.create({
    name: "Admin Instructor",
    email: instructorEmail,
    password: hashed,
    role: "instructor",
  });
  console.log("Created instructor login:");
  console.log("  Email:", instructorEmail);
  console.log("  Password:", instructorPassword);
} else {
  console.log("Instructor already exists:", instructorEmail);
}

console.log("\nStudent signup: use school code", schoolCode, "on the Register tab.");
console.log("Done.");
process.exit(0);
