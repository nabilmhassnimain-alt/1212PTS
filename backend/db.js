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
        console.error("❌ MONGODB_URI not set");
        throw new Error("MONGODB_URI environment variable is not defined");
    }

    // Create connection promise to handle concurrent requests
    connectionPromise = (async () => {
        try {
            console.log("🔌 Connecting to MongoDB...");
            client = new MongoClient(uri);
            await client.connect();

            // Parse database name from URI
            // URI format: mongodb+srv://user:pass@cluster.mongodb.net/dbname?options
            let dbName = "translationdb"; // default
            try {
                const url = new URL(uri.replace("mongodb+srv://", "https://").replace("mongodb://", "https://"));
                const pathParts = url.pathname.split("/").filter(Boolean);
                if (pathParts.length > 0) {
                    dbName = pathParts[0];
                }
            } catch (e) {
                console.log("Using default database name:", dbName);
            }

            db = client.db(dbName);
            console.log(`✅ Connected to MongoDB: ${dbName}`);

            // Create indexes (but don't fail if they already exist)
            await createIndexes();

            return db;
        } catch (error) {
            console.error("❌ MongoDB connection error:", error.message);
            connectionPromise = null; // Reset so we can retry
            throw error;
        }
    })();

    return connectionPromise;
}

async function createIndexes() {
    try {
        await db.collection("texts").createIndex({ status: 1 });
        await db.collection("texts").createIndex({ createdAt: -1 });
        await db.collection("codes").createIndex({ code: 1 });
        await db.collection("codes").createIndex({ active: 1 });
        console.log("✅ Database indexes created");
    } catch (error) {
        // Indexes might already exist, that's fine
        console.log("ℹ️  Index setup:", error.message);
    }
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
