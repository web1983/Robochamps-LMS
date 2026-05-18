import mongoose from "mongoose";

const getMongoUri = () =>
  (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

/** @type {{ conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }} */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export function getDbConnectionHint(error) {
  const uri = getMongoUri();
  if (!uri) {
    return "Add MONGO_URI in Vercel → Settings → Environment Variables (Production), then redeploy.";
  }

  const name = error?.name || "";
  const msg = (error?.message || "").toLowerCase();

  if (name === "MongoAuthenticationError" || msg.includes("authentication failed")) {
    return "Wrong database username or password in MONGO_URI. In Atlas, reset the DB user password and update Vercel. If the password has @ # % etc., URL-encode it in the connection string.";
  }

  if (
    name === "MongoServerSelectionError" ||
    msg.includes("timed out") ||
    msg.includes("connect econnrefused") ||
    msg.includes("getaddrinfo")
  ) {
    return "MongoDB Atlas → Network Access → add 0.0.0.0/0 (allow from anywhere). Ensure the cluster is not paused and the connection string uses the correct cluster hostname.";
  }

  return "Check MongoDB Atlas Network Access (0.0.0.0/0), database user credentials, and that MONGO_URI in Vercel matches server/.env exactly.";
}

const connectDB = async () => {
  const MONGODB_URI = getMongoUri();

  if (!MONGODB_URI) {
    throw new Error(
      "MONGO_URI is not set. Add it in Vercel → Project Settings → Environment Variables."
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
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4,
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
