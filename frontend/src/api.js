// Production build
// If VITE_API_URL is set, use it. Otherwise, if we are on Vercel (production), use relative /api path. 
// Fallback to dynamic local IP for local development.
const isVercel = import.meta.env.PROD;
const API_BASE = import.meta.env.VITE_API_URL || (isVercel ? "/api" : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:4000`);

/**
 * Helper to handle response and parsed JSON errors
 */
async function handleResponse(res, defaultMsg) {
    if (!res.ok) {
        // Try to parse JSON error from server
        try {
            const errData = await res.json();
            const serverMsg = errData.error || errData.message; // some servers use .message
            if (serverMsg) throw new Error(serverMsg);

            // Special handling for debug info if present (mostly for login)
            if (errData.debug) {
                const d = errData.debug;
                throw new Error(`Invalid: '${d.received}' (Len:${d.receivedLength}). EnvVars: Admin=${d.adminCodesLength}, User=${d.userCodesLength}`);
            }
        } catch (e) {
            // If the error we just threw is "Invalid: ...", propagate it
            if (e.message && (e.message.startsWith("Invalid:") || e.message !== defaultMsg)) {
                throw e;
            }
            // If json() failed or no error field, throw default (or standard status text)
        }
        throw new Error(defaultMsg || `Request failed (${res.status})`);
    }
    // For DELETE/PUT that might return empty body
    if (res.status === 204) return null;
    return res.json().catch(() => ({})); // Handle empty JSON safely
}

// ==================== AUTH ====================

export async function loginWithCode(code) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
    });
    // Keep custom 404 check for login as it's a common config issue
    if (!res.ok && res.status === 404) {
        throw new Error("Server not found (404) - check Vercel Root");
    }
    return handleResponse(res, "Invalid code");
}

export async function logout() {
    await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
}

export async function fetchMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
    });
    if (!res.ok) return null; // silent fail for me
    return res.json();
}

// ==================== TEXTS ====================

export async function fetchTexts() {
    const res = await fetch(`${API_BASE}/texts`, {
        credentials: "include",
    });
    return handleResponse(res, "Not authorized");
}

export async function createText(payload) {
    const res = await fetch(`${API_BASE}/texts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return handleResponse(res, "Failed to create text");
}

export async function updateText(id, payload) {
    const res = await fetch(`${API_BASE}/texts/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return handleResponse(res, "Failed to update text");
}

export async function updateTextStatus(id, status) {
    const res = await fetch(`${API_BASE}/texts/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    return handleResponse(res, "Failed to update status");
}

export async function approveText(id) {
    const res = await fetch(`${API_BASE}/texts/${id}/approve`, {
        method: "PUT",
        credentials: "include",
    });
    return handleResponse(res, "Failed to approve");
}

export async function deleteText(id) {
    const res = await fetch(`${API_BASE}/texts/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(res, "Failed to delete text");
}

// ==================== CODES ====================

export async function fetchCodes() {
    const res = await fetch(`${API_BASE}/admin/codes`, {
        credentials: "include",
    });
    return handleResponse(res, "Failed to fetch codes");
}

export async function generateCode(role, label = "") {
    const res = await fetch(`${API_BASE}/auth/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, label }),
    });
    return handleResponse(res, "Failed to generate code");
}

export async function deleteCode(codeId) {
    const res = await fetch(`${API_BASE}/admin/codes/${codeId}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(res, "Failed to delete code");
}

export async function updateCodeLabel(codeId, label) {
    const res = await fetch(`${API_BASE}/admin/codes/${codeId}/label`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
    });
    return handleResponse(res, "Failed to update label");
}

// ==================== VOCABULARY ====================

export async function fetchVocabulary() {
    const res = await fetch(`${API_BASE}/vocabulary`, {
        credentials: "include",
    });
    return handleResponse(res, "Failed to fetch vocabulary");
}

export async function addVocabularyItem(type, value) {
    const res = await fetch(`${API_BASE}/vocabulary/${type}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
    });
    return handleResponse(res, "Failed to add item");
}

export async function renameVocabularyItem(type, oldVal, newVal) {
    const res = await fetch(`${API_BASE}/vocabulary/${type}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldVal, newVal }),
    });
    return handleResponse(res, "Failed to rename item");
}

export async function deleteVocabularyItem(type, val) {
    const res = await fetch(`${API_BASE}/vocabulary/${type}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: val }),
    });
    return handleResponse(res, "Failed to delete item");
}

// ==================== SUGGESTIONS ====================

export async function fetchSuggestions() {
    const res = await fetch(`${API_BASE}/admin/suggestions`, {
        credentials: "include",
    });
    return handleResponse(res, "Failed to fetch suggestions");
}

export async function submitSuggestion(content) {
    const res = await fetch(`${API_BASE}/suggestions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
    return handleResponse(res, "Failed to submit suggestion");
}

export async function updateSuggestionStatus(id, status) {
    const res = await fetch(`${API_BASE}/admin/suggestions/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    return handleResponse(res, "Failed to update status");
}

export async function deleteSuggestion(id) {
    const res = await fetch(`${API_BASE}/admin/suggestions/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(res, "Failed to delete suggestion");
}
