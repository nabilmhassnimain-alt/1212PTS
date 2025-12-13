// Production build
// If VITE_API_URL is set, use it. Otherwise, if we are on Vercel (production), use relative /api path. 
// Fallback to dynamic local IP for local development.
const isVercel = import.meta.env.PROD;
const API_BASE = import.meta.env.VITE_API_URL || (isVercel ? "/api" : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:4000`);

export async function loginWithCode(code) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
    });
    if (!res.ok) {
        if (res.status === 404) throw new Error("Server not found (404) - check Vercel Root");
        throw new Error("Invalid code");
    }
    return res.json();
}

export async function fetchMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
}

export async function logout() {
    await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
}

export async function fetchTexts() {
    const res = await fetch(`${API_BASE}/texts`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Not authorized");
    return res.json();
}

export async function createText(payload) {
    const res = await fetch(`${API_BASE}/texts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create");
    return res.json();
}

export async function updateText(id, payload) {
    const res = await fetch(`${API_BASE}/texts/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update");
    return res.json();
}

export async function generateCode(role, label = "") {
    const res = await fetch(`${API_BASE}/auth/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, label }),
    });
    if (!res.ok) throw new Error("Failed to generate code");
    return res.json();
}

export async function approveText(id) {
    const res = await fetch(`${API_BASE}/texts/${id}/approve`, {
        method: "PUT",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to approve");
    return res.json();
}

export async function fetchCodes() {
    const res = await fetch(`${API_BASE}/admin/codes`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch codes");
    return res.json();
}

export async function deleteCode(codeId) {
    const res = await fetch(`${API_BASE}/admin/codes/${codeId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete code");
    return res.json();
}

export async function updateCodeLabel(codeId, label) {
    const res = await fetch(`${API_BASE}/admin/codes/${codeId}/label`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
    });
    if (!res.ok) throw new Error("Failed to update label");
    return res.json();
}

export async function deleteText(id) {
    const res = await fetch(`${API_BASE}/texts/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete text");
    return res.json();
}

export async function fetchVocabulary() {
    const res = await fetch(`${API_BASE}/vocabulary`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch vocabulary");
    return res.json();
}

export async function renameVocabularyItem(type, oldVal, newVal) {
    const res = await fetch(`${API_BASE}/vocabulary/${type}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldVal, newVal }),
    });
    if (!res.ok) throw new Error("Failed to rename item");
    return res.json();
}

export async function deleteVocabularyItem(type, val) {
    const res = await fetch(`${API_BASE}/vocabulary/${type}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: val }),
    });
    if (!res.ok) throw new Error("Failed to delete item");
    return res.json();
}

export async function updateTextStatus(id, status) {
    const res = await fetch(`${API_BASE}/texts/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
}

export async function submitSuggestion(content) {
    const res = await fetch(`${API_BASE}/suggestions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Failed to submit suggestion");
    return res.json();
}

export async function fetchSuggestions() {
    const res = await fetch(`${API_BASE}/admin/suggestions`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch suggestions");
    return res.json();
}

export async function updateSuggestionStatus(id, status) {
    const res = await fetch(`${API_BASE}/admin/suggestions/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
}

export async function deleteSuggestion(id) {
    const res = await fetch(`${API_BASE}/admin/suggestions/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete suggestion");
    return res.json();
}
