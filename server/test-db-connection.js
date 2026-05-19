/**
 * Test MongoDB connection using server/.env
 * Run: node test-db-connection.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const uri = (process.env.MONGO_URI || "").trim();

if (!uri) {
  console.error("MONGO_URI is missing in server/.env");
  process.exit(1);
}

// Show host only (hide password)
const safe = uri.replace(/:([^@/]+)@/, ":****@");
console.log("Connecting to:", safe);

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });
  console.log("SUCCESS — MongoDB connected. Use this exact MONGO_URI in Vercel.");
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("FAILED:", err.name, err.message);
  if (err.message?.toLowerCase().includes("authentication")) {
    console.error("\nFix: Atlas → Database Access → reset password → copy Drivers URI → update server/.env and Vercel MONGO_URI");
  }
  process.exit(1);
}
