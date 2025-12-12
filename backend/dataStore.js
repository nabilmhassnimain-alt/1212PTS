import { getDB } from './db.js';
import { ObjectId } from 'mongodb';

// Helper to get collections
async function getCollections() {
  const db = await getDB();
  return {
    texts: db.collection('texts'),
    codes: db.collection('codes'),
    vocabulary: db.collection('vocabulary')
  };
}

// Get all data (for compatibility)
export async function getAllTexts() {
  try {
    const { texts, codes, vocabulary } = await getCollections();
    
    const [textsData, codesData, vocabData] = await Promise.all([
      texts.find({}).toArray(),
      codes.find({}).toArray(),
      vocabulary.findOne({ _id: 'main' })
    ]);

    return {
      texts: textsData || [],
      codes: codesData || [],
      vocabulary: vocabData || { tags: [], playlists: [] }
    };
  } catch (error) {
    console.error('Error getting all texts:', error);
    return { texts: [], codes: [], vocabulary: { tags: [], playlists: [] } };
  }
}

// Add text
export async function addText(textData, status = 'active') {
  try {
    const { texts } = await getCollections();
    
    const newText = {
      id: new ObjectId().toString(),
      primary: textData.primary,
      translations: textData.translations || {},
      tags: textData.tags || [],
      playlists: textData.playlists || [],
      status,
      createdAt: new Date()
    };

    await texts.insertOne(newText);
    return newText;
  } catch (error) {
    console.error('Error adding text:', error);
    throw error;
  }
}

// Update text
export async function updateText(id, updates) {
  try {
    const { texts } = await getCollections();
    
    await texts.updateOne(
      { id },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    return await texts.findOne({ id });
  } catch (error) {
    console.error('Error updating text:', error);
    return null;
  }
}

// Update text status
export async function updateTextStatus(id, status) {
  return updateText(id, { status });
}

// Delete text
export async function deleteText(id) {
  try {
    const { texts } = await getCollections();
    const result = await texts.deleteOne({ id });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting text:', error);
    return false;
  }
}

// Generate code
export async function generateCode(role, label = "", createdBy = "admin") {
  try {
    const { codes } = await getCollections();
    
    const code = Math.random().toString(36).substring(2, 10);
    const newCode = {
      id: new ObjectId().toString(),
      code,
      role,
      label,
      createdBy,
      active: true,
      createdAt: new Date()
    };

    await codes.insertOne(newCode);
    return newCode;
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

// Get code role
export function getCodeRole(code) {
  // This will be checked in real-time from MongoDB in the login route
  return null;
}

// Get code record
export async function getCodeRecord(code) {
  try {
    const { codes } = await getCollections();
    return await codes.findOne({ code, active: true });
  } catch (error) {
    console.error('Error getting code record:', error);
    return null;
  }
}

// Revoke code
export async function revokeCode(id) {
  try {
    const { codes } = await getCollections();
    
    await codes.updateOne(
      { id },
      { $set: { active: false, revokedAt: new Date() } }
    );

    return await codes.findOne({ id });
  } catch (error) {
    console.error('Error revoking code:', error);
    return null;
  }
}

// Delete code
export async function deleteCode(id) {
  try {
    const { codes } = await getCollections();
    const result = await codes.deleteOne({ id });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting code:', error);
    return false;
  }
}

// Update code label
export async function updateCodeLabel(id, label) {
  try {
    const { codes } = await getCollections();
    
    await codes.updateOne(
      { id },
      { $set: { label } }
    );

    return await codes.findOne({ id });
  } catch (error) {
    console.error('Error updating code label:', error);
    return null;
  }
}

// Vocabulary operations
export async function addVocabularyItem(type, value) {
  try {
    const { vocabulary } = await getCollections();
    
    await vocabulary.updateOne(
      { _id: 'main' },
      { $addToSet: { [type]: value } },
      { upsert: true }
    );

    const updated = await vocabulary.findOne({ _id: 'main' });
    return updated || { tags: [], playlists: [] };
  } catch (error) {
    console.error('Error adding vocabulary item:', error);
    throw error;
  }
}

export async function renameVocabularyItem(type, oldVal, newVal) {
  try {
    const { vocabulary, texts } = await getCollections();
    
    // Update vocabulary
    await vocabulary.updateOne(
      { _id: 'main' },
      { 
        $pull: { [type]: oldVal },
        $addToSet: { [type]: newVal }
      }
    );

    // Update all texts using this value
    const updateField = type === 'tags' ? 'tags' : 'playlists';
    await texts.updateMany(
      { [updateField]: oldVal },
      { $set: { [`${updateField}.$[elem]`]: newVal } },
      { arrayFilters: [{ elem: oldVal }] }
    );

    const updated = await vocabulary.findOne({ _id: 'main' });
    return updated || { tags: [], playlists: [] };
  } catch (error) {
    console.error('Error renaming vocabulary item:', error);
    throw error;
  }
}

export async function deleteVocabularyItem(type, value) {
  try {
    const { vocabulary, texts } = await getCollections();
    
    // Remove from vocabulary
    await vocabulary.updateOne(
      { _id: 'main' },
      { $pull: { [type]: value } }
    );

    // Remove from all texts
    const updateField = type === 'tags' ? 'tags' : 'playlists';
    await texts.updateMany(
      {},
      { $pull: { [updateField]: value } }
    );

    const updated = await vocabulary.findOne({ _id: 'main' });
    return updated || { tags: [], playlists: [] };
  } catch (error) {
    console.error('Error deleting vocabulary item:', error);
    throw error;
  }
}
