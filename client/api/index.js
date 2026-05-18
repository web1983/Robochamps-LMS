import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../../server/database/db.js";
import app from "../../server/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../server/.env") });

await connectDB().catch((err) => {
  console.error("Cold start DB:", err.message);
});

export default app;

export const config = {
  maxDuration: 60,
};
