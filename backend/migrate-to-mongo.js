import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { connectDB, getDB } from "./db.js";

dotenv.config();

async function migrate() {
    console.log("=== MongoDB Migration Script ===\n");

    const DATA_PATH = path.join(process.cwd(), "data.json");

    // Check if data.json exists
    if (!fs.existsSync(DATA_PATH)) {
        console.log("❌ No data.json file found. Nothing to migrate.");
        console.log("   If you want to start fresh, this is fine!");
        process.exit(0);
    }

    try {
        // Read existing data
        const rawData = fs.readFileSync(DATA_PATH, "utf8");
        const data = JSON.parse(rawData);

        console.log("📁 Found data.json with:");
        console.log(`   - ${data.texts?.length || 0} texts`);
        console.log(`   - ${data.codes?.length || 0} codes`);
        console.log(`   - ${data.vocabulary?.tags?.length || 0} tags`);
        console.log(`   - ${data.vocabulary?.playlists?.length || 0} playlists`);
        console.log();

        // Connect to MongoDB
        console.log("🔌 Connecting to MongoDB...");
        await connectDB();
        const db = getDB();
        console.log("✅ Connected!\n");

        // Migrate texts
        if (data.texts && data.texts.length > 0) {
            console.log(`📝 Migrating ${data.texts.length} texts...`);
            const textsCollection = db.collection("texts");

            // Clear existing texts (optional - comment out if you want to keep existing)
            await textsCollection.deleteMany({});

            await textsCollection.insertMany(data.texts);
            console.log(`✅ Migrated ${data.texts.length} texts\n`);
        }

        // Migrate codes
        if (data.codes && data.codes.length > 0) {
            console.log(`🔑 Migrating ${data.codes.length} codes...`);
            const codesCollection = db.collection("codes");

            // Clear existing codes (optional)
            await codesCollection.deleteMany({});

            await codesCollection.insertMany(data.codes);
            console.log(`✅ Migrated ${data.codes.length} codes\n`);
        }

        // Migrate vocabulary
        if (data.vocabulary) {
            console.log("📚 Migrating vocabulary...");
            const vocabCollection = db.collection("vocabulary");

            // Clear existing vocabulary (optional)
            await vocabCollection.deleteMany({});

            await vocabCollection.insertOne({
                _id: "main",
                tags: data.vocabulary.tags || [],
                playlists: data.vocabulary.playlists || [],
            });
            console.log(`✅ Migrated vocabulary\n`);
        }

        // Verify migration
        console.log("🔍 Verifying migration...");
        const textsCount = await db.collection("texts").countDocuments();
        const codesCount = await db.collection("codes").countDocuments();
        const vocab = await db.collection("vocabulary").findOne({ _id: "main" });

        console.log("\n📊 Migration Results:");
        console.log(`   ✅ Texts in MongoDB: ${textsCount}`);
        console.log(`   ✅ Codes in MongoDB: ${codesCount}`);
        console.log(`   ✅ Tags in MongoDB: ${vocab?.tags?.length || 0}`);
        console.log(`   ✅ Playlists in MongoDB: ${vocab?.playlists?.length || 0}`);

        // Create backup of data.json
        const backupPath = path.join(process.cwd(), "data.json.backup");
        fs.copyFileSync(DATA_PATH, backupPath);
        console.log(`\n💾 Created backup: ${backupPath}`);

        console.log("\n🎉 Migration completed successfully!");
        console.log("\n📝 Next steps:");
        console.log("   1. Start your server: npm run dev");
        console.log("   2. Test the application locally");
        console.log("   3. Add MONGODB_URI to Vercel environment variables");
        console.log("   4. Deploy to Vercel");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
