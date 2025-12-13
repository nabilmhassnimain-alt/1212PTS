import { getDB } from "./db.js";

// ==================== TEXTS OPERATIONS ====================

export async function getAllTexts(statusFilter = null) {
    const db = getDB();
    const textsCollection = db.collection("texts");

    const query = statusFilter ? { status: statusFilter } : {};
    const texts = await textsCollection.find(query).sort({ createdAt: -1 }).toArray();

    return texts;
}

export async function addText(textObj, status = "active") {
    const db = getDB();
    const textsCollection = db.collection("texts");

    const newItem = {
        id: Date.now().toString(),
        primary: textObj.primary,
        translations: textObj.translations || {},
        tags: textObj.tags || [],
        playlists: textObj.playlists || [],
        status,
        createdAt: new Date().toISOString(),
    };

    await textsCollection.insertOne(newItem);

    // Update vocabulary with new tags/playlists
    if (newItem.tags.length > 0 || newItem.playlists.length > 0) {
        await updateVocabularyFromText(newItem.tags, newItem.playlists);
    }

    return newItem;
}

export async function updateText(id, updates) {
    const db = getDB();
    const textsCollection = db.collection("texts");

    // Ensure structure
    if (updates.translations === undefined) updates.translations = {};
    if (updates.tags === undefined) updates.tags = [];
    if (updates.playlists === undefined) updates.playlists = [];

    const result = await textsCollection.findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: "after" }
    );

    if (result) {
        // Update vocabulary if tags/playlists changed
        if (updates.tags || updates.playlists) {
            await updateVocabularyFromText(
                updates.tags || [],
                updates.playlists || []
            );
        }
    }

    return result;
}

export async function updateTextStatus(id, status) {
    const db = getDB();
    const textsCollection = db.collection("texts");

    const result = await textsCollection.findOneAndUpdate(
        { id },
        { $set: { status } },
        { returnDocument: "after" }
    );

    return result;
}

export async function deleteText(id) {
    const db = getDB();
    const textsCollection = db.collection("texts");

    const result = await textsCollection.deleteOne({ id });
    return result.deletedCount > 0;
}

// ==================== CODE OPERATIONS ====================

export async function getCodeRole(code) {
    const db = getDB();
    const codesCollection = db.collection("codes");

    const found = await codesCollection.findOne({ code, active: true });
    return found ? found.role : null;
}

export async function getCodeRecord(code) {
    const db = getDB();
    const codesCollection = db.collection("codes");

    return await codesCollection.findOne({ code });
}

export async function getAllCodes(includeInactive = false) {
    const db = getDB();
    const codesCollection = db.collection("codes");

    const query = includeInactive ? {} : { active: true };
    return await codesCollection.find(query).sort({ createdAt: -1 }).toArray();
}

export async function generateCode(role, label = "", createdBy = "system") {
    const db = getDB();
    const codesCollection = db.collection("codes");

    const newCode = Math.random().toString(36).substring(2, 10);
    const codeRecord = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        code: newCode,
        role,
        label,
        createdAt: new Date().toISOString(),
        createdBy,
        active: true,
    };

    await codesCollection.insertOne(codeRecord);
    return codeRecord;
}

export async function revokeCode(id) {
    const db = getDB();
    const codesCollection = db.collection("codes");

    const result = await codesCollection.findOneAndUpdate(
        { id },
        { $set: { active: false } },
        { returnDocument: "after" }
    );

    return result;
}

export async function updateCodeLabel(id, label) {
    const db = getDB();
    const codesCollection = db.collection("codes");

    const result = await codesCollection.findOneAndUpdate(
        { id },
        { $set: { label } },
        { returnDocument: "after" }
    );

    return result;
}

// Keep deleteCode for backward compatibility
export async function deleteCode(codeString) {
    const db = getDB();
    const codesCollection = db.collection("codes");

    const result = await codesCollection.updateOne(
        { code: codeString },
        { $set: { active: false } }
    );

    return result.modifiedCount > 0;
}

// ==================== VOCABULARY OPERATIONS ====================

async function ensureVocabulary() {
    const db = getDB();
    const vocabCollection = db.collection("vocabulary");

    let vocab = await vocabCollection.findOne({ _id: "main" });

    if (!vocab) {
        vocab = {
            _id: "main",
            tags: [],
            playlists: [],
        };
        await vocabCollection.insertOne(vocab);
    }

    return vocab;
}

export async function getVocabulary() {
    const vocab = await ensureVocabulary();
    return {
        tags: vocab.tags || [],
        playlists: vocab.playlists || [],
    };
}

async function updateVocabularyFromText(tags, playlists) {
    const db = getDB();
    const vocabCollection = db.collection("vocabulary");

    await ensureVocabulary();

    const updateOps = {};

    if (tags && tags.length > 0) {
        updateOps.$addToSet = { ...updateOps.$addToSet, tags: { $each: tags } };
    }

    if (playlists && playlists.length > 0) {
        updateOps.$addToSet = { ...updateOps.$addToSet, playlists: { $each: playlists } };
    }

    if (Object.keys(updateOps).length > 0) {
        await vocabCollection.updateOne({ _id: "main" }, updateOps);
    }
}

export async function addVocabularyItem(type, value) {
    const db = getDB();
    const vocabCollection = db.collection("vocabulary");

    await ensureVocabulary();

    const result = await vocabCollection.updateOne(
        { _id: "main" },
        { $addToSet: { [type]: value } }
    );

    if (result.modifiedCount > 0) {
        return { success: true, message: "Added" };
    }
    return { success: false, message: "Already exists" };
}

export async function renameVocabularyItem(type, oldVal, newVal) {
    const db = getDB();
    const vocabCollection = db.collection("vocabulary");
    const textsCollection = db.collection("texts");

    const vocab = await ensureVocabulary();
    const list = vocab[type] || [];

    if (!list.includes(oldVal)) {
        return { success: false, message: "Not found" };
    }

    // Update vocabulary list
    await vocabCollection.updateOne(
        { _id: "main" },
        {
            $pull: { [type]: oldVal },
        }
    );

    await vocabCollection.updateOne(
        { _id: "main" },
        {
            $addToSet: { [type]: newVal },
        }
    );

    // Update all texts that have this value
    const updateQuery = type === "tags" ? { tags: oldVal } : { playlists: oldVal };

    const result = await textsCollection.updateMany(
        updateQuery,
        {
            $set: {
                [type]: {
                    $map: {
                        input: `$${type}`,
                        as: "item",
                        in: { $cond: [{ $eq: ["$$item", oldVal] }, newVal, "$$item"] },
                    },
                },
            },
        }
    );

    // Alternative simpler approach since $map might not work in updateMany
    // Get all matching texts and update them individually
    const textsToUpdate = await textsCollection.find(updateQuery).toArray();
    let count = 0;

    for (const text of textsToUpdate) {
        const updatedArray = text[type].map((item) =>
            item === oldVal ? newVal : item
        );
        await textsCollection.updateOne(
            { id: text.id },
            { $set: { [type]: updatedArray } }
        );
        count++;
    }

    return { success: true, updatedTexts: count };
}

export async function deleteVocabularyItem(type, value) {
    const db = getDB();
    const vocabCollection = db.collection("vocabulary");
    const textsCollection = db.collection("texts");

    const vocab = await ensureVocabulary();
    const list = vocab[type] || [];

    if (!list.includes(value)) {
        return { success: false, message: "Not found" };
    }

    // Remove from vocabulary
    await vocabCollection.updateOne(
        { _id: "main" },
        { $pull: { [type]: value } }
    );

    // Remove from all texts
    await textsCollection.updateMany(
        {},
        { $pull: { [type]: value } }
    );

    // Count how many were updated
    const updateCheck = await textsCollection.countDocuments({
        [type]: { $exists: true, $ne: [] },
    });

    return { success: true, updatedTexts: updateCheck };
}
