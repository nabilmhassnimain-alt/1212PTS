// Production build
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
    serverTimestamp,
    orderBy
} from "firebase/firestore";

// ==================== HELPER ====================
// Map Firestore docs to objects with IDs
const mapDoc = (d) => ({ id: d.id, ...d.data() });

// ==================== AUTH ====================

// Hardcoded Master Codes (Replicated from previous backend)
const ADMIN_CODES = ["1212", "0000", "admin-2025"]; // Add your master/admin codes here
const USER_CODES = ["1111"]; // Add your standard user codes here

export async function loginWithCode(code) {
    code = code.trim();

    // 1. Check Hardcoded Masters
    if (ADMIN_CODES.includes(code)) return { role: 'admin', label: 'Admin' };
    if (USER_CODES.includes(code)) return { role: 'user', label: 'User' };

    // 2. Check Firestore 'codes' collection
    try {
        const q = query(collection(db, "codes"), where("code", "==", code));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            // Check if active (if you have an active field)
            return { role: docData.role, label: docData.label || docData.role };
        }
    } catch (e) {
        console.error("Auth Error:", e);
        throw new Error("Connection failed: " + e.message);
    }

    throw new Error("Invalid code");
}

export async function logout() {
    // Client-side only - simple no-op or clear local state if needed
    return true;
}

export async function fetchMe() {
    // In a stateless client app, 'me' is persisted in localStorage by the UI usually.
    // If you need to re-validate, we'd need a token system. 
    // For now, we return null to force the UI to use its stored user or re-login.
    return null;
}

// ==================== TEXTS ====================

export async function fetchTexts() {
    // For admins we might want all, for users only active
    // We'll simplisticly fetch ALL and filter in UI or fetch by query
    // Let's implement basic "fetch all" for now
    try {
        const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDoc);
    } catch (e) {
        // If index is missing, it will throw. Fallback to unsorted.
        const snapshot = await getDocs(collection(db, "texts"));
        return snapshot.docs.map(mapDoc);
    }
}

export async function createText(payload) {
    if (!payload.primary) throw new Error("Primary text required");

    const newItem = {
        ...payload,
        status: 'pending', // Default to pending, admin can approve
        createdAt: new Date().toISOString()
        // Firestore timestamps are objects, usually easier to stick to ISO strings for existing UI compat
    };

    const docRef = await addDoc(collection(db, "texts"), newItem);
    return { id: docRef.id, ...newItem };
}

export async function updateText(id, payload) {
    const docRef = doc(db, "texts", id);
    await updateDoc(docRef, payload);
    return { id, ...payload }; // Optimistic return
}

export async function updateTextStatus(id, status) {
    const docRef = doc(db, "texts", id);
    await updateDoc(docRef, { status });
    return { id, status };
}

export async function approveText(id) {
    return updateTextStatus(id, 'active');
}

export async function deleteText(id) {
    const docRef = doc(db, "texts", id);
    await deleteDoc(docRef);
    return { id };
}

// ==================== CODES ====================

export async function fetchCodes() {
    const snapshot = await getDocs(collection(db, "codes"));
    return snapshot.docs.map(mapDoc);
}

export async function generateCode(role, label = "") {
    // Generate a random 6-digit code for simplicity
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const newCode = {
        code,
        role,
        label,
        createdBy: 'admin',
        createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "codes"), newCode);
    return { id: docRef.id, ...newCode };
}

export async function deleteCode(codeId) {
    await deleteDoc(doc(db, "codes", codeId));
    return { id: codeId };
}

export async function updateCodeLabel(codeId, label) {
    await updateDoc(doc(db, "codes", codeId), { label });
    return { id: codeId, label };
}

// ==================== VOCABULARY ====================

async function getVocabDoc(type) {
    // Single doc approach: collection 'vocabulary', doc 'tags'
    const docRef = doc(db, "vocabulary", type);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().values || [];
    return [];
}

export async function fetchVocabulary() {
    const tags = await getVocabDoc('tags');
    const playlists = await getVocabDoc('playlists');
    return { tags, playlists };
}

export async function addVocabularyItem(type, value) {
    const docRef = doc(db, "vocabulary", type);
    // Ensure doc exists
    await setDoc(docRef, {
        values: arrayUnion(value)
    }, { merge: true });

    return { type, value };
}

export async function renameVocabularyItem(type, oldVal, newVal) {
    const docRef = doc(db, "vocabulary", type);
    // Firestore arrayRemove/Union is atomic but for rename we need read-modify-write
    // to keep order, or just remove-add. Remove-add loses order.
    // Let's do robust remove then add.

    // 1. Remove old
    await updateDoc(docRef, { values: arrayRemove(oldVal) });
    // 2. Add new
    await updateDoc(docRef, { values: arrayUnion(newVal) });

    return { type, oldVal, newVal };
}

export async function deleteVocabularyItem(type, val) {
    const docRef = doc(db, "vocabulary", type);
    await updateDoc(docRef, { values: arrayRemove(val) });
    return { type, value: val };
}

// ==================== SUGGESTIONS ====================

export async function fetchSuggestions() {
    try {
        const q = query(collection(db, "suggestions"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDoc);
    } catch {
        const snapshot = await getDocs(collection(db, "suggestions"));
        return snapshot.docs.map(mapDoc);
    }
}

export async function submitSuggestion(content) {
    const newItem = {
        content,
        status: 'pending',
        createdAt: new Date().toISOString(),
        author: { role: 'user' } // Simplified author
    };
    const docRef = await addDoc(collection(db, "suggestions"), newItem);
    return { id: docRef.id, ...newItem };
}

export async function updateSuggestionStatus(id, status) {
    await updateDoc(doc(db, "suggestions", id), { status });
    return { id, status };
}

export async function deleteSuggestion(id) {
    await deleteDoc(doc(db, "suggestions", id));
    return { id };
}
