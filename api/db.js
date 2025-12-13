import { MongoClient } from "mongodb";

let client = null;
let db = null;
let connectionPromise = null;

export async function connectDB() {
    // If already connected, return existing db
    if (db) {
        return db;
    }

    // If connection is in progress, wait for it
    if (connectionPromise) {
        return connectionPromise;
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error("❌ MONGODB_URI not set. Available env vars:", Object.keys(process.env).filter(k => !k.includes('SECRET')));
        throw new Error("MONGODB_URI environment variable is not defined");
    }

    console.log("🔌 MONGODB_URI exists, length:", uri.length);
    console.log("🔌 URI starts with:", uri.substring(0, 20) + "...");

    // Create connection promise to handle concurrent requests
    connectionPromise = (async () => {
        try {
            console.log("🔌 Creating MongoClient...");
            client = new MongoClient(uri, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
            });

            console.log("🔌 Calling client.connect()...");
            await client.connect();
            console.log("🔌 client.connect() succeeded!");

            // Use fixed database name to avoid parsing issues
            const dbName = "translationdb";
            db = client.db(dbName);

            console.log(`✅ Connected to MongoDB: ${dbName}`);

            // Create indexes (but don't fail if they already exist)
            try {
                await db.collection("texts").createIndex({ status: 1 });
                await db.collection("texts").createIndex({ createdAt: -1 });
                await db.collection("codes").createIndex({ code: 1 });
                await db.collection("codes").createIndex({ active: 1 });
                console.log("✅ Database indexes created");
            } catch (indexError) {
                console.log("ℹ️ Index setup:", indexError.message);
            }

            return db;
        } catch (error) {
            console.error("❌ MongoDB connection error:", error.message);
            console.error("❌ Error name:", error.name);
            console.error("❌ Error code:", error.code);
            connectionPromise = null; // Reset so we can retry
            throw error;
        }
    })();

    return connectionPromise;
}

export function getDB() {
    if (!db) {
        throw new Error("Database not connected. Call connectDB() first.");
    }
    return db;
}

// For Vercel serverless - export a function that ensures connection
export async function ensureConnected() {
    if (!db) {
        await connectDB();
    }
    return db;
}
