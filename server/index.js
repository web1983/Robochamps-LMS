import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import connectDB, { getDbConnectionHint } from "./database/db.js";
import userRoute from "./routes/user.routes.js"
import cors from "cors";
import courseRoute from "./routes/course.route.js"
import enrollmentRoute from "./routes/enrollment.route.js"
import analyticsRoute from "./routes/analytics.route.js"
import settingsRoute from "./routes/settings.route.js"
import schoolCodeRoute from "./routes/schoolCode.route.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Vercel serverless: /api/* requests may arrive without the /api prefix
app.use((req, _res, next) => {
    const path = req.url.split("?")[0];
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    if (!path.startsWith("/api")) {
        req.url = `/api${path.startsWith("/") ? path : `/${path}`}${qs}`;
    }
    next();
});

// CORS configuration for both development and production
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://lms.robowunder.in",
    "https://lms.robowunder.com",
    "https://lms-amber-nine.vercel.app",
    "https://robochamps-lms.vercel.app",
    "https://www.robochamps-lms.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

const isLocalhostOrigin = (origin) => {
    try {
        const url = new URL(origin);
        return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    } catch {
        return false;
    }
};

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow any localhost port (Vite may switch ports)
        if (process.env.NODE_ENV !== "production" && isLocalhostOrigin(origin)) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('⚠️ CORS blocked origin:', origin);
            console.log('✅ Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Health check endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "LMS Backend API is running"
    });
});

app.get("/home", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Hello from backend"
    });
});

// Diagnostic — no DB required (use after deploy to verify env vars)
app.get("/api/health", (req, res) => {
    const mongoUriConfigured = Boolean(
        (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim() ||
        (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD && (process.env.MONGODB_CLUSTER || process.env.MONGODB_HOST))
    );
    const jwtConfigured = Boolean(process.env.JWT_SECRET);
    res.status(200).json({
        success: true,
        mongoUriConfigured,
        jwtConfigured,
        vercel: Boolean(process.env.VERCEL),
        ...(!mongoUriConfigured || !jwtConfigured
            ? {
                  fix: "Vercel → Project Settings → Environment Variables → add MONGO_URI and JWT_SECRET for Production → Redeploy (disable build cache).",
              }
            : {}),
    });
});

// Tries a real DB connection (open in browser after deploy)
app.get("/api/health/db", async (req, res) => {
    try {
        await connectDB();
        res.status(200).json({ success: true, message: "MongoDB connected" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message,
            errorType: error.name,
            hint: getDbConnectionHint(error),
        });
    }
});

// Connect to database before handling requests
app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message,
            errorType: error.name,
            hint: getDbConnectionHint(error),
        });
    }
});

// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/enrollment", enrollmentRoute);
app.use("/api/v1/analytics", analyticsRoute);
app.use("/api/v1/settings", settingsRoute);
app.use("/api/v1/school-code", schoolCodeRoute);

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
