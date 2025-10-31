import mongoose, { Connection } from "mongoose";

// Type definitions for connection cache
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

// Global cache declaration for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Initialize connection cache
// Prevents multiple connections during development hot reloads
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes connection to MongoDB with caching
 * Returns existing connection if available, otherwise creates new one
 */
async function connectMongoDB(): Promise<Connection> {
  // Return cached connection if exists
  if (cached?.conn) {
    return cached.conn;
  }

  // Create new connection if no promise exists
  if (!cached?.promise) {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI!, options)
      .then((mongooseInstance) => mongooseInstance.connection);
  }

  try {
    cached!.conn = await cached!.promise;
    return cached!.conn;
  } catch (error) {
    cached!.promise = null;
    throw error;
  }
}

/**
 * Disconnects from MongoDB and clears cache
 * Primarily used for testing and cleanup
 */
export async function disconnectMongoDB(): Promise<void> {
  if (cached?.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

export default connectMongoDB;
