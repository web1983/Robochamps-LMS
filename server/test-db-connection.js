/**
 * Test MongoDB — run: npm run test:db
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { buildMongoUri } from "./database/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const uri = buildMongoUri();

if (!uri) {
  console.error("No MongoDB config. Set MONGO_URI or MONGODB_USER + MONGODB_PASSWORD + MONGODB_CLUSTER in server/.env");
  process.exit(1);
}

console.log("Connecting to:", uri.replace(/:([^@/]+)@/, ":****@"));

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, family: 4, authSource: "admin" });
  console.log("\nSUCCESS — MongoDB works. Copy the SAME values to Vercel, then redeploy.\n");
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("\nFAILED:", err.name, "-", err.message);
  console.error("\nDo this in Atlas:");
  console.error("  1. Database Access → ADD NEW DATABASE USER");
  console.error("  2. Username: robochamps_app  |  Password: Autogenerate (copy it!)");
  console.error("  3. Privileges: Read and write to any database");
  console.error("  4. Database → Connect → Drivers → copy connection string");
  console.error("  5. Paste into server/.env as MONGO_URI OR use split vars:");
  console.error("     MONGODB_USER=...");
  console.error("     MONGODB_PASSWORD=...");
  console.error("     MONGODB_CLUSTER=cluster0.xxxxx.mongodb.net");
  console.error("  6. Run npm run test:db again until SUCCESS\n");
  process.exit(1);
}
