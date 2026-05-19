import mongoose from "mongoose";

/** Build URI from MONGO_URI or from separate vars (password auto-encoded). */
export function buildMongoUri() {
  const full = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();
  if (full) return full;

  const user = process.env.MONGODB_USER?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const host =
    process.env.MONGODB_CLUSTER?.trim() ||
    process.env.MONGODB_HOST?.trim();
  const db = process.env.MONGODB_DB?.trim() || "lms";

  if (user && password && host) {
    const hostname = host.replace(/^mongodb\+srv:\/\//, "").replace(/\/.*$/, "");
    return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${hostname}/${db}?retryWrites=true&w=majority&authSource=admin`;
  }

  return "";
}

/** @type {{ conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }} */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export function getDbConnectionHint(error) {
  const uri = buildMongoUri();
  if (!uri) {
    return "Set MONGO_URI in Vercel, OR set MONGODB_USER + MONGODB_PASSWORD + MONGODB_CLUSTER (cluster host from Atlas). Then redeploy.";
  }

  const name = error?.name || "";
  const msg = (error?.message || "").toLowerCase();

  if (
    name === "MongoParseError" ||
    msg.includes("unescaped") ||
    msg.includes("password contains")
  ) {
    return "Use separate Vercel vars MONGODB_USER, MONGODB_PASSWORD, MONGODB_CLUSTER instead of one MONGO_URI string.";
  }

  if (name === "MongoAuthenticationError" || msg.includes("authentication failed")) {
    return "Atlas password does not match. Create a NEW database user in Atlas (Database Access), copy the Drivers connection string, update .env / Vercel, run: npm run test:db";
  }

  if (
    name === "MongoServerSelectionError" ||
    msg.includes("timed out") ||
    msg.includes("connect econnrefused") ||
    msg.includes("getaddrinfo")
  ) {
    return "MongoDB Atlas → Network Access → add 0.0.0.0/0. Ensure cluster is running.";
  }

  return "Run npm run test:db in the server folder locally until it says SUCCESS, then copy the same values to Vercel.";
}

const connectDB = async () => {
  const MONGODB_URI = buildMongoUri();

  if (!MONGODB_URI) {
    throw new Error(
      "MongoDB not configured. Set MONGO_URI or MONGODB_USER + MONGODB_PASSWORD + MONGODB_CLUSTER."
    );
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const isServerless = Boolean(process.env.VERCEL);

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: isServerless ? 1 : 10,
        serverSelectionTimeoutMS: isServerless ? 10000 : 30000,
        socketTimeoutMS: 45000,
        family: 4,
        connectTimeoutMS: 10000,
        authSource: "admin",
      })
      .then((mongooseInstance) => {
        console.log("MongoDB Connected");
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("MongoDB connection failed:", error.name, error.message);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
};

export default connectDB;
