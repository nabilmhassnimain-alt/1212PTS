// Production build - Firebase Client SDK
import { db } from "./firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    setDoc,
    arrayUnion,
    arrayRemove,
    orderBy
} from "firebase/firestore";

// ==================== HELPERS ====================
const mapDoc = (d) => ({ id: d.id, ...d.data() });

const withTimeout = (promise, ms = 15000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out - check Firebase Rules")), ms)
        )
    ]);
};

// ==================== AUTH ====================
const ADMIN_CODES = ["1212", "0000", "admin-2025"];
const USER_CODES = ["1111"];

export async function loginWithCode(code) {
    code = code.trim();
    if (ADMIN_CODES.includes(code)) return { role: 'admin', label: 'Admin' };
    if (USER_CODES.includes(code)) return { role: 'user', label: 'User' };

    try {
        const q = query(collection(db, "codes"), where("code", "==", code));
        const snap = await withTimeout(getDocs(q));
        if (!snap.empty) {
            const data = snap.docs[0].data();
            return { role: data.role, label: data.label || data.role };
        }
    } catch (e) {
        console.error("Auth Error:", e);
        throw new Error("Connection failed: " + e.message);
    }
    throw new Error("Invalid code");
}

export async function logout() { return true; }
export async function fetchMe() { return null; }

// ==================== TEXTS ====================
export async function fetchTexts() {
    try {
        const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
        const snap = await withTimeout(getDocs(q));
        return snap.docs.map(mapDoc);
    } catch (e) {
        console.warn("Falling back to unsorted:", e.message);
        const snap = await withTimeout(getDocs(collection(db, "texts")));
        return snap.docs.map(mapDoc);
    }
}

export async function createText(payload) {
    if (!payload.primary) throw new Error("Primary text required");
    const newItem = {
        ...payload,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    const docRef = await withTimeout(addDoc(collection(db, "texts"), newItem));
    return { id: docRef.id, ...newItem };
}

export async function updateText(id, payload) {
    await withTimeout(updateDoc(doc(db, "texts", id), payload));
    return { id, ...payload };
}

export async function updateTextStatus(id, status) {
    await withTimeout(updateDoc(doc(db, "texts", id), { status }));
    return { id, status };
}

export async function approveText(id) {
    return updateTextStatus(id, 'active');
}

export async function deleteText(id) {
    await withTimeout(deleteDoc(doc(db, "texts", id)));
    return { id };
}

// ==================== CODES ====================
export async function fetchCodes() {
    const snap = await withTimeout(getDocs(collection(db, "codes")));
    return snap.docs.map(mapDoc);
}

export async function generateCode(role, label = "") {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newCode = { code, role, label, createdBy: 'admin', createdAt: new Date().toISOString() };
    const docRef = await withTimeout(addDoc(collection(db, "codes"), newCode));
    return { id: docRef.id, ...newCode };
}

export async function deleteCode(codeId) {
    await withTimeout(deleteDoc(doc(db, "codes", codeId)));
    return { id: codeId };
}

export async function updateCodeLabel(codeId, label) {
    await withTimeout(updateDoc(doc(db, "codes", codeId), { label }));
    return { id: codeId, label };
}

// ==================== VOCABULARY ====================
async function getVocabDoc(type) {
    const snap = await withTimeout(getDoc(doc(db, "vocabulary", type)));
    return snap.exists() ? snap.data().values || [] : [];
}

export async function fetchVocabulary() {
    const [tags, playlists] = await Promise.all([getVocabDoc('tags'), getVocabDoc('playlists')]);
    return { tags, playlists };
}

export async function addVocabularyItem(type, value) {
    await withTimeout(setDoc(doc(db, "vocabulary", type), { values: arrayUnion(value) }, { merge: true }));
    return { type, value };
}

export async function renameVocabularyItem(type, oldVal, newVal) {
    const ref = doc(db, "vocabulary", type);
    await withTimeout(updateDoc(ref, { values: arrayRemove(oldVal) }));
    await withTimeout(updateDoc(ref, { values: arrayUnion(newVal) }));
    return { type, oldVal, newVal };
}

export async function deleteVocabularyItem(type, val) {
    await withTimeout(updateDoc(doc(db, "vocabulary", type), { values: arrayRemove(val) }));
    return { type, value: val };
}

// ==================== SUGGESTIONS ====================
export async function fetchSuggestions() {
    try {
        const q = query(collection(db, "suggestions"), orderBy("createdAt", "desc"));
        const snap = await withTimeout(getDocs(q));
        return snap.docs.map(mapDoc);
    } catch {
        const snap = await withTimeout(getDocs(collection(db, "suggestions")));
        return snap.docs.map(mapDoc);
    }
}

export async function submitSuggestion(content) {
    const newItem = { content, status: 'pending', createdAt: new Date().toISOString(), author: { role: 'user' } };
    const docRef = await withTimeout(addDoc(collection(db, "suggestions"), newItem));
    return { id: docRef.id, ...newItem };
}

export async function updateSuggestionStatus(id, status) {
    await withTimeout(updateDoc(doc(db, "suggestions", id), { status }));
    return { id, status };
}

export async function deleteSuggestion(id) {
    await withTimeout(deleteDoc(doc(db, "suggestions", id)));
    return { id };
}
