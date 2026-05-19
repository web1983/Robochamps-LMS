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
const adminEmail = "web@robowunder.com";
const adminPassword = "Robochamps";

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

const hashed = await bcrypt.hash(adminPassword, 10);
let admin = await User.findOne({ email: adminEmail });

if (!admin) {
  admin = await User.create({
    name: "Robowunder Admin",
    email: adminEmail,
    password: hashed,
    role: "instructor",
  });
  console.log("Created admin account:");
} else {
  admin.password = hashed;
  admin.role = "instructor";
  admin.name = admin.name || "Robowunder Admin";
  await admin.save();
  console.log("Updated admin account:");
}

console.log("  Email:", adminEmail);
console.log("  Password:", adminPassword);
console.log("\nStudent signup: use school code", schoolCode, "on the Register tab.");
console.log("Done.");
process.exit(0);
