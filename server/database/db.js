import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI;

/** @type {{ conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }} */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGO_URI is not set. Add it in Vercel → Project Settings → Environment Variables."
    );
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log("MongoDB Connected");
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("MongoDB connection failed:", error.message);
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
