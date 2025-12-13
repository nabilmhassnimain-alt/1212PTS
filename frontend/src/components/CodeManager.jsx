import { useState, useEffect } from "react";
import { fetchCodes, generateCode, deleteCode, updateCodeLabel } from "../api";

export default function CodeManager() {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [maskedCodes, setMaskedCodes] = useState(new Set());
    const [editingLabel, setEditingLabel] = useState(null);
    const [newCodeModal, setNewCodeModal] = useState(null); // 'mod' | 'user' | null
    const [newLabel, setNewLabel] = useState("");
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        loadCodes();
    }, []);

    async function loadCodes() {
        try {
            const data = await fetchCodes();
            setCodes(data);
            // Mask all codes by default
            setMaskedCodes(new Set(data.map(c => c.id)));
        } catch (e) {
            console.error(e);
        }
    }

    async function handleGenerateSubmit() {
        if (!newCodeModal) return;
        setLoading(true);
        try {
            const created = await generateCode(newCodeModal, newLabel);
            setCodes(prev => [created, ...prev]);
            // Unmask the newly created code to show it
            setMaskedCodes(prev => {
                const next = new Set(prev);
                next.delete(created.id);
                return next;
            });
            setNewCodeModal(null);
            setNewLabel("");
            // Auto-copy to clipboard
            navigator.clipboard.writeText(created.code);
            setCopiedId(created.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (e) {
            alert(e.message || "Failed to generate code");
        } finally {
            setLoading(false);
        }
    }

    async function handleRevoke(codeId) {
        if (!confirm("Revoke this code? The user will no longer be able to log in.")) return;
        try {
            await deleteCode(codeId);
            setCodes(prev => prev.filter(c => c.id !== codeId));
        } catch (e) {
            alert(e.message || "Failed to revoke code");
        }
    }

    async function handleUpdateLabel(codeId, label) {
        try {
            await updateCodeLabel(codeId, label);
            setCodes(prev => prev.map(c => c.id === codeId ? { ...c, label } : c));
            setEditingLabel(null);
        } catch (e) {
            alert(e.message || "Failed to update label");
        }
    }

    const toggleMask = (codeId) => {
        setMaskedCodes(prev => {
            const next = new Set(prev);
            if (next.has(codeId)) {
                next.delete(codeId);
            } else {
                next.add(codeId);
            }
            return next;
        });
    };

    const copyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const maskCode = (code, isMasked) => {
        if (!isMasked) return code;
        return code.substring(0, 4) + '***';
    };

    const modCodes = codes.filter(c => c.role === 'mod');
    const userCodes = codes.filter(c => c.role === 'user');

    return (
        <>
            <div className={`bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg shadow-indigo-900/5 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? '' : 'hover:bg-white/70'}`}>
                {/* Header */}
                <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer select-none border-b border-transparent hover:bg-white/40 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg text-white shadow-sm ${isExpanded ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Access Management</h3>
                        {!isExpanded && (
                            <div className="flex gap-2 ml-2">
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{modCodes.length} Mods</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{userCodes.length} Users</span>
                            </div>
                        )}
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/50">
                        {/* Mod Codes */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mod Codes</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setNewCodeModal('mod'); }}
                                    disabled={loading}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    New Mod
                                </button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                {modCodes.length === 0 && <p className="text-sm text-slate-400 italic pl-1">No active mod codes</p>}
                                {modCodes.map(code => {
                                    const isMasked = maskedCodes.has(code.id);
                                    const isCopied = copiedId === code.id;
                                    return (
                                        <div key={code.id} className="group flex items-start justify-between p-3 rounded-xl bg-white/50 border border-indigo-50 hover:border-indigo-200 hover:bg-white hover:shadow-sm transition-all">
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <button
                                                        onClick={() => toggleMask(code.id)}
                                                        className="font-mono text-indigo-900 font-bold tracking-wide text-sm hover:text-indigo-600 transition-colors"
                                                        title={isMasked ? "Click to reveal" : "Click to hide"}
                                                    >
                                                        {maskCode(code.code, isMasked)}
                                                    </button>
                                                    {isCopied && <span className="text-[10px] text-emerald-600 font-bold animate-fade-in">✓ Copied</span>}
                                                </div>
                                                {editingLabel === code.id ? (
                                                    <input
                                                        type="text"
                                                        defaultValue={code.label || ""}
                                                        onBlur={(e) => handleUpdateLabel(code.id, e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateLabel(code.id, e.target.value)}
                                                        className="text-xs px-2 py-0.5 border border-indigo-200 rounded focus:outline-none focus:border-indigo-400 mb-1"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingLabel(code.id)}
                                                        className="text-xs text-slate-600 hover:text-indigo-600 text-left transition-colors mb-1"
                                                    >
                                                        {code.label || 'Add label...'}
                                                    </button>
                                                )}
                                                <span className="text-[10px] text-slate-400">Created {new Date(code.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                                <button onClick={() => copyCode(code.code, code.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Copy full code">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                </button>
                                                <button onClick={() => handleRevoke(code.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Revoke access">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* User Codes */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">User Codes</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setNewCodeModal('user'); }}
                                    disabled={loading}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    New User
                                </button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                {userCodes.length === 0 && <p className="text-sm text-slate-400 italic pl-1">No active user codes</p>}
                                {userCodes.map(code => {
                                    const isMasked = maskedCodes.has(code.id);
                                    const isCopied = copiedId === code.id;
                                    return (
                                        <div key={code.id} className="group flex items-start justify-between p-3 rounded-xl bg-white/50 border border-emerald-50 hover:border-emerald-200 hover:bg-white hover:shadow-sm transition-all">
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <button
                                                        onClick={() => toggleMask(code.id)}
                                                        className="font-mono text-emerald-900 font-bold tracking-wide text-sm hover:text-emerald-600 transition-colors"
                                                        title={isMasked ? "Click to reveal" : "Click to hide"}
                                                    >
                                                        {maskCode(code.code, isMasked)}
                                                    </button>
                                                    {isCopied && <span className="text-[10px] text-emerald-600 font-bold animate-fade-in">✓ Copied</span>}
                                                </div>
                                                {editingLabel === code.id ? (
                                                    <input
                                                        type="text"
                                                        defaultValue={code.label || ""}
                                                        onBlur={(e) => handleUpdateLabel(code.id, e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateLabel(code.id, e.target.value)}
                                                        className="text-xs px-2 py-0.5 border border-emerald-200 rounded focus:outline-none focus:border-emerald-400 mb-1"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingLabel(code.id)}
                                                        className="text-xs text-slate-600 hover:text-emerald-600 text-left transition-colors mb-1"
                                                    >
                                                        {code.label || 'Add label...'}
                                                    </button>
                                                )}
                                                <span className="text-[10px] text-slate-400">Created {new Date(code.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                                <button onClick={() => copyCode(code.code, code.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Copy full code">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                </button>
                                                <button onClick={() => handleRevoke(code.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Revoke access">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Code Modal */}
            {newCodeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setNewCodeModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Generate {newCodeModal === 'mod' ? 'Moderator' : 'User'} Code</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Label (Optional)</label>
                                <input
                                    type="text"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="e.g., TikTok VA 1, John's Access..."
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    autoFocus
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Helps you identify who this code is for</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setNewCodeModal(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerateSubmit}
                                    disabled={loading}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-md ${newCodeModal === 'mod' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                    {loading ? "..." : "Generate & Copy"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
