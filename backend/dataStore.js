import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data.json");

function init() {
    if (!fs.existsSync(DATA_PATH)) {
        // Initial schema with vocabulary
        fs.writeFileSync(DATA_PATH, JSON.stringify({
            texts: [],
            codes: [],
            vocabulary: { tags: [], playlists: [] }
        }, null, 2));
    }
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export function getAllTexts() {
    init();
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const data = JSON.parse(raw);
    // Ensure strict structure
    if (!data.codes) data.codes = [];
    if (!data.vocabulary) data.vocabulary = { tags: [], playlists: [] };
    return data;
}

export function getCodeRole(code) {
    const data = getAllTexts();
    const found = data.codes.find(c => c.code === code);
    // Only return role if code is active
    return (found && found.active !== false) ? found.role : null;
}

export function getCodeRecord(code) {
    const data = getAllTexts();
    return data.codes.find(c => c.code === code);
}

export function generateCode(role, label = "", createdBy = "system") {
    const data = getAllTexts();
    const newCode = Math.random().toString(36).substring(2, 10);
    const codeRecord = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        code: newCode,
        role,
        label,
        createdAt: new Date().toISOString(),
        createdBy,
        active: true
    };
    data.codes.push(codeRecord);
    saveData(data);
    return codeRecord;
}

export function revokeCode(id) {
    const data = getAllTexts();
    const code = data.codes.find(c => c.id === id);
    if (code) {
        code.active = false;
        saveData(data);
        return code;
    }
    return null;
}

export function updateCodeLabel(id, label) {
    const data = getAllTexts();
    const code = data.codes.find(c => c.id === id);
    if (code) {
        code.label = label;
        saveData(data);
        return code;
    }
    return null;
}

// Keep deleteCode for backward compatibility but make it revoke
export function deleteCode(codeString) {
    const data = getAllTexts();
    const code = data.codes.find(c => c.code === codeString);
    if (code) {
        code.active = false;
        saveData(data);
        return true;
    }
    return false;
}

// Helper to update vocabulary
function updateVocabulary(data, newTags, newPlaylists) {
    let changed = false;
    if (newTags && newTags.length > 0) {
        const uniqueTags = new Set([...data.vocabulary.tags, ...newTags]);
        if (uniqueTags.size > data.vocabulary.tags.length) {
            data.vocabulary.tags = Array.from(uniqueTags).sort();
            changed = true;
        }
    }
    if (newPlaylists && newPlaylists.length > 0) {
        const uniquePlaylists = new Set([...data.vocabulary.playlists, ...newPlaylists]);
        if (uniquePlaylists.size > data.vocabulary.playlists.length) {
            data.vocabulary.playlists = Array.from(uniquePlaylists).sort();
            changed = true;
        }
    }
    return changed;
}

export function addText(textObj, status = 'active') {
    const data = getAllTexts();

    // textObj now expected to have { primary, translations: {fr, de...}, tags, playlists }
    const newItem = {
        id: Date.now().toString(),
        primary: textObj.primary,
        translations: textObj.translations || {}, // e.g. { fr: "...", de: "..." }
        tags: textObj.tags || [],
        playlists: textObj.playlists || [],
        status,
        createdAt: new Date().toISOString(),
    };

    if (!data.texts) data.texts = [];
    data.texts.push(newItem);

    // Update vocabulary
    updateVocabulary(data, newItem.tags, newItem.playlists);

    saveData(data);
    return newItem;
}

export function updateTextStatus(id, status) {
    const data = getAllTexts();
    const text = data.texts.find(t => t.id === id);
    if (text) {
        text.status = status;
        saveData(data);
        return text;
    }
    return null;
}

export function deleteText(id) {
    const data = getAllTexts();
    const initialLength = data.texts.length;
    data.texts = data.texts.filter(t => t.id !== id);
    if (data.texts.length !== initialLength) {
        saveData(data);
        return true;
    }
    return false;
}

export function updateText(id, updates) {
    const data = getAllTexts();
    const index = data.texts.findIndex(t => t.id === id);
    if (index !== -1) {
        // Merge updates
        const current = data.texts[index];
        const updated = { ...current, ...updates };

        // Ensure structure
        if (!updated.translations) updated.translations = {};
        if (!updated.tags) updated.tags = [];
        if (!updated.playlists) updated.playlists = [];

        data.texts[index] = updated;

        // Update vocab
        updateVocabulary(data, updated.tags, updated.playlists);

        saveData(data);
        return updated;
    }
    return null;
}

export function addVocabularyItem(type, value) {
    const data = getAllTexts();
    const list = data.vocabulary[type];
    if (!list.includes(value)) {
        list.push(value);
        list.sort();
        saveData(data);
        return { success: true, message: "Added" };
    }
    return { success: false, message: "Already exists" };
}

export function renameVocabularyItem(type, oldVal, newVal) {
    const data = getAllTexts();
    const list = data.vocabulary[type];
    const index = list.indexOf(oldVal);
    if (index !== -1) {
        // Update list
        list[index] = newVal;
        list.sort();

        // Update all texts
        let count = 0;
        data.texts.forEach(text => {
            if (type === 'tags' && text.tags && text.tags.includes(oldVal)) {
                text.tags = text.tags.map(t => t === oldVal ? newVal : t);
                count++;
            }
            if (type === 'playlists' && text.playlists && text.playlists.includes(oldVal)) {
                text.playlists = text.playlists.map(p => p === oldVal ? newVal : p);
                count++;
            }
        });

        saveData(data);
        return { success: true, updatedTexts: count };
    }
    return { success: false, message: "Not found" };
}

export function deleteVocabularyItem(type, value) {
    const data = getAllTexts();
    const list = data.vocabulary[type];
    const index = list.indexOf(value);

    if (index !== -1) {
        // Remove from list
        data.vocabulary[type] = list.filter(item => item !== value);

        // Remove from all texts
        let count = 0;
        data.texts.forEach(text => {
            if (type === 'tags' && text.tags) {
                const initLen = text.tags.length;
                text.tags = text.tags.filter(t => t !== value);
                if (text.tags.length !== initLen) count++;
            }
            if (type === 'playlists' && text.playlists) {
                const initLen = text.playlists.length;
                text.playlists = text.playlists.filter(p => p !== value);
                if (text.playlists.length !== initLen) count++;
            }
        });

        saveData(data);
        return { success: true, updatedTexts: count };
    }
    return { success: false, message: "Not found" };
}
