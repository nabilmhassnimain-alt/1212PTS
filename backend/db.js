import { MongoClient } from "mongodb";

let client = null;
let db = null;

export async function connectDB() {
    if (db) {
        return db; // Return existing connection
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI environment variable is not defined");
    }

    try {
        client = new MongoClient(uri);
        await client.connect();

        // Get database name from URI or use default
        const dbName = uri.split("/").pop().split("?")[0] || "translation-app";
        db = client.db(dbName);

        console.log(`✅ Connected to MongoDB: ${dbName}`);

        // Create indexes for better performance
        await createIndexes();

        return db;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}

async function createIndexes() {
    try {
        // Index for texts collection
        await db.collection("texts").createIndex({ status: 1 });
        await db.collection("texts").createIndex({ createdAt: -1 });

        // Index for codes collection
        await db.collection("codes").createIndex({ code: 1 }, { unique: true });
        await db.collection("codes").createIndex({ active: 1 });

        console.log("✅ Database indexes created");
    } catch (error) {
        console.error("⚠️  Index creation warning:", error.message);
    }
}

export function getDB() {
    if (!db) {
        throw new Error("Database not connected. Call connectDB() first.");
    }
    return db;
}

// Graceful shutdown
process.on("SIGINT", async () => {
    if (client) {
        await client.close();
        console.log("MongoDB connection closed");
        process.exit(0);
    }
});
