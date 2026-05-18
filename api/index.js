import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local dev: load server/.env (Vercel injects env vars in production)
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

export { default } from "../server/index.js";
