// Production build
const API_BASE =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD && typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:4000");

export async function loginWithCode(code) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Invalid code");
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
