import { useState, useEffect, useRef } from "react";
import { createText, updateText, fetchVocabulary } from "../api";
import { LANGUAGES, getTopicEmoji } from "../dataUtils";
import VocabularyManager from "./VocabularyManager";

function CompactChipInput({ label, options, value, onChange, placeholder, onManage, onMultiSelect }) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const available = options.filter(o => !value.includes(o));
        if (!input) {
            setSuggestions(available);
        } else {
            const filtered = available.filter(o => o.toLowerCase().includes(input.toLowerCase()));
            setSuggestions(filtered);
        }
    }, [input, options, value]);

    const addChip = (item) => {
        if (!value.includes(item)) onChange([...value, item]);
        setInput("");
    };

    const removeChip = (item) => onChange(value.filter(v => v !== item));

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            addChip(input.trim());
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeChip(value[value.length - 1]);
        }
    };

    return (
        <div className="group/field relative">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest group-focus-within/field:text-indigo-500 transition-colors">{label}</label>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{value.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    {onMultiSelect && (
                        <button type="button" onClick={onMultiSelect} className="text-[10px] font-bold text-purple-600 hover:text-purple-700 uppercase tracking-wide opacity-0 group-hover/field:opacity-100 transition-opacity flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            Select
                        </button>
                    )}
                    {onManage && (
                        <button type="button" onClick={onManage} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wide opacity-0 group-hover/field:opacity-100 transition-opacity">
                            Manage
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white/50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-sm hover:bg-white/80 min-h-[42px]">
                {value.map(chip => {
                    const emoji = getTopicEmoji(chip);
                    return (
                        <span key={chip} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold animate-scale-in">
                            {emoji && <span>{emoji}</span>}
                            {chip}
                            <button type="button" onClick={() => removeChip(chip)} className="hover:text-indigo-900 hover:bg-indigo-200/50 rounded-full p-0.5">&times;</button>
                        </span>
                    )
                })}
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[80px] text-sm outline-none bg-transparent px-1 py-0.5"
                />
            </div>
            {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto animate-scale-in origin-top">
                    {suggestions.map(s => {
                        const emoji = getTopicEmoji(s);
                        return (
                            <button key={s} type="button" onClick={() => addChip(s)} className="block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-slate-700 font-medium transition-colors">
                                {emoji && <span className="mr-2">{emoji}</span>}
                                {s}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

export default function AdminForm({ onCreated, onUpdated, onCancel, editingText, isMod }) {
    const [primary, setPrimary] = useState("");
    const [translations, setTranslations] = useState({ fr: "", de: "", it: "", pt: "", es: "" });
    const [tags, setTags] = useState([]);
    const [playlists, setPlaylists] = useState([]);

    const [vocabulary, setVocabulary] = useState({ tags: [], playlists: [] });
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showTranslations, setShowTranslations] = useState(false);

    const [success, setSuccess] = useState(false);
    const lastSubmittedRef = useRef({ tags: [], playlists: [] });

    // Manage Vocabulary
    const [managingType, setManagingType] = useState(null); // 'tags' or 'playlists'

    // CSV Import
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvInput, setCsvInput] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);

    // Multi-Select Modal
    const [showMultiSelectModal, setShowMultiSelectModal] = useState(false);
    const [tempSelectedPlaylists, setTempSelectedPlaylists] = useState([]);
    const [playlistSearch, setPlaylistSearch] = useState('');

    useEffect(() => { loadVocab(); }, []);

    useEffect(() => {
        if (editingText) {
            setIsExpanded(true);
            setShowTranslations(true);
            setPrimary(editingText.primary);
            setTranslations({ ...editingText.translations });
            setTags(editingText.tags || []);
            setPlaylists(editingText.playlists || []);
            setSuccess(false);
        }
    }, [editingText]);

    async function loadVocab() {
        try {
            const v = await fetchVocabulary();
            setVocabulary(v);
        } catch (e) { }
    }

    const handleDuplicate = () => {
        setTags([...new Set([...tags, ...lastSubmittedRef.current.tags])]);
        setPlaylists([...new Set([...playlists, ...lastSubmittedRef.current.playlists])]);
    };

    const handleClear = () => {
        setPrimary("");
        setTranslations({ fr: "", de: "", it: "", pt: "", es: "" });
        setTags([]);
        setPlaylists([]);
        setSuccess(false);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSuccess(false);
        if (!primary.trim()) return alert("Primary text required");

        setLoading(true);
        try {
            const payload = { primary, translations, tags, playlists };
            if (editingText) {
                const updated = await updateText(editingText.id, payload);
                onUpdated(updated);
                setSuccess(true);
            } else {
                const created = await createText(payload);
                onCreated(created);
                lastSubmittedRef.current = { tags, playlists };
                handleClear();
                setSuccess(true);
            }
            loadVocab();
            setTimeout(() => setSuccess(false), 2000);
        } catch (err) {
            console.error(err);
            alert(err.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    }

    async function handleCSVImport() {
        if (!csvInput.trim()) return;

        setImporting(true);
        setImportResults(null);

        try {
            const lines = csvInput.trim().split('\n');
            const results = { success: 0, failed: 0, errors: [] };

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    // Parse CSV line handling quoted fields
                    const match = line.match(/^([^,]*),([^,]*),([^,]*),(.*)$/);
                    if (!match) throw new Error('Invalid CSV format');

                    const primary = match[1]?.trim();
                    const tagsStr = match[2]?.trim();
                    const playlistsStr = match[3]?.trim();
                    let translationsStr = match[4]?.trim();

                    // Remove surrounding quotes and unescape doubled quotes
                    if (translationsStr.startsWith('"') && translationsStr.endsWith('"')) {
                        translationsStr = translationsStr.slice(1, -1).replace(/""/g, '"');
                    }

                    if (!primary) {
                        results.failed++;
                        results.errors.push('Empty primary text');
                        continue;
                    }

                    // Parse translations JSON
                    let translations = {};
                    if (translationsStr) {
                        try {
                            const parsed = JSON.parse(translationsStr);
                            // Convert language names to codes (French -> fr, German -> de, etc.)
                            const langMap = { 'French': 'fr', 'German': 'de', 'Italian': 'it', 'Portuguese': 'pt', 'Spanish': 'es' };
                            translations = {};
                            for (const [lang, text] of Object.entries(parsed)) {
                                const code = langMap[lang] || lang.toLowerCase();
                                translations[code] = text;
                            }
                        } catch (e) {
                            console.warn('Failed to parse translations:', e);
                        }
                    }

                    // Parse tags and playlists
                    const tags = tagsStr ? tagsStr.split(';').map(t => t.trim()).filter(Boolean) : [];
                    const playlists = playlistsStr ? playlistsStr.split(';').map(p => p.trim()).filter(Boolean) : [];

                    // Create the text
                    await createText({ primary, translations, tags, playlists });
                    results.success++;

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error importing "${line.substring(0, 30)}...": ${error.message}`);
                }
            }

            setImportResults(results);

            // Reload vocabulary and clear form if successful
            if (results.success > 0) {
                loadVocab();
                setCsvInput('');
                // Trigger parent reload
                if (onCreated) {
                    // We need to trigger a reload, but we'll do it via a simple page context
                    window.location.reload();
                }
            }

        } catch (error) {
            alert('Import failed: ' + error.message);
        } finally {
            setImporting(false);
        }
    }

    return (
        <>
            <div className={`bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg shadow-indigo-900/5 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? '' : 'hover:bg-white/70'}`}>
                {/* Header - Collapsible */}
                <div
                    className={`px-6 py-4 flex items-center justify-between cursor-pointer select-none border-b border-white/50 hover:bg-white/40 transition-colors ${editingText ? 'bg-indigo-50/50' : ''}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg text-white shadow-sm ${editingText ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingText ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} /></svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                {editingText ? "Edit Text" : "Add Primary Text"}
                            </h2>
                            {success && <span className="text-xs text-emerald-600 font-bold ml-2 animate-fade-in block mt-0.5">Saved Successfully!</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!editingText && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowImportModal(true); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 border border-transparent hover:border-indigo-200"
                            title="Import from CSV"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            Import CSV
                        </button>
                    )}
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>

                {/* Form Content */}
                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Primary */}
                        <div className="relative">
                            <textarea
                                value={primary}
                                onChange={(e) => setPrimary(e.target.value)}
                                placeholder="Enter primary text..."
                                className="w-full rounded-xl bg-white/50 px-5 py-4 text-base text-slate-800 border-2 border-transparent focus:border-indigo-100 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/10 outline-none transition-all resize-y min-h-[100px]"
                                rows={3}
                            />
                        </div>

                        {/* Compact Tags & Playlists Row */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1 w-full">
                                <CompactChipInput
                                    label="Ad Angle Fit"
                                    options={vocabulary.tags}
                                    value={tags}
                                    onChange={setTags}
                                    placeholder="Add tag..."
                                    onManage={() => setManagingType('tags')}
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <CompactChipInput
                                    label="Playlists"
                                    options={vocabulary.playlists}
                                    value={playlists}
                                    onChange={setPlaylists}
                                    placeholder="Add playlist..."
                                    onManage={() => setManagingType('playlists')}
                                    onMultiSelect={() => {
                                        setTempSelectedPlaylists([...playlists]);
                                        setPlaylistSearch('');
                                        setShowMultiSelectModal(true);
                                    }}
                                />
                            </div>
                            {/* Shortcuts */}
                            <div className="flex pt-8 gap-2">
                                <button type="button" onClick={handleDuplicate} className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Duplicate last tags/playlists">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                                <button type="button" onClick={handleClear} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Clear all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Translations Area */}
                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100/50 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowTranslations(!showTranslations)}
                                className="w-full px-5 py-3 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100/50 transition-colors"
                            >
                                <span>Translations ({Object.values(translations).filter(Boolean).length}/5)</span>
                                <svg className={`w-4 h-4 transition-transform ${showTranslations ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {showTranslations && (
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-5 gap-4 animate-slide-up">
                                    {LANGUAGES.map(lang => (
                                        <div key={lang.code} className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                                <img src={lang.flag} alt={lang.label} className="w-5 h-4 object-cover rounded-sm" />
                                                {lang.code}
                                            </label>
                                            <textarea
                                                value={translations[lang.code] || ""}
                                                onChange={(e) => setTranslations({ ...translations, [lang.code]: e.target.value })}
                                                className="w-full rounded-lg bg-white border border-slate-200 text-sm px-3 py-2 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-500/20 outline-none resize-none h-[80px]"
                                                placeholder="..."
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            {editingText && (
                                <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg text-slate-500 text-xs font-bold uppercase tracking-wide hover:bg-slate-100">Cancel</button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-2.5 rounded-lg text-white text-xs font-bold uppercase tracking-wide shadow-md hover:shadow-lg transition-all transform active:scale-95 ${editingText ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                            >
                                {loading ? "..." : (editingText ? "Save Changes" : isMod ? "Submit" : "Create Text")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CSV Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Import from CSV</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Paste your CSV data below (one text per line)</p>
                            </div>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 overflow-y-auto space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">CSV Data</label>
                                <textarea
                                    value={csvInput}
                                    onChange={(e) => setCsvInput(e.target.value)}
                                    placeholder='Primary Text,Tags,Playlists,{"French":"...","German":"...","Italian":"...","Portuguese":"...","Spanish":"..."}'
                                    className="w-full h-64 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono resize-none"
                                />
                                <p className="text-xs text-slate-400">
                                    Format: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Primary,Tags,Playlists,TranslationsJSON</code>
                                    <br />
                                    • Separate multiple tags/playlists with semicolons (;)
                                    <br />
                                    • Use empty fields (,,) if no tags/playlists
                                </p>
                            </div>

                            {/* Import Results */}
                            {importResults && (
                                <div className={`p-4 rounded-xl ${importResults.success > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-start gap-2">
                                        <svg className={`w-5 h-5 flex-shrink-0 ${importResults.success > 0 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {importResults.success > 0 ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            )}
                                        </svg>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${importResults.success > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                ✓ {importResults.success} imported successfully
                                                {importResults.failed > 0 && ` • ${importResults.failed} failed`}
                                            </p>
                                            {importResults.errors.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {importResults.errors.slice(0, 5).map((err, i) => (
                                                        <p key={i} className="text-xs text-red-600">{err}</p>
                                                    ))}
                                                    {importResults.errors.length > 5 && (
                                                        <p className="text-xs text-red-500">...and {importResults.errors.length - 5} more errors</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCSVImport}
                                disabled={importing || !csvInput.trim()}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importing ? "Importing..." : "Import"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Multi-Select Playlist Modal */}
            {showMultiSelectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowMultiSelectModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Select Playlists</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{tempSelectedPlaylists.length} selected</p>
                            </div>
                            <button onClick={() => setShowMultiSelectModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Search and Actions */}
                        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={playlistSearch}
                                    onChange={(e) => setPlaylistSearch(e.target.value)}
                                    placeholder="Search playlists..."
                                    className="w-full px-4 py-2 pl-9 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
                                />
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <button
                                onClick={() => setTempSelectedPlaylists([...vocabulary.playlists])}
                                className="px-3 py-2 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-200"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setTempSelectedPlaylists([])}
                                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            >
                                Clear All
                            </button>
                        </div>

                        {/* Playlist Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {vocabulary.playlists
                                    .filter(pl => pl.toLowerCase().includes(playlistSearch.toLowerCase()))
                                    .map(playlist => {
                                        const isSelected = tempSelectedPlaylists.includes(playlist);
                                        const emoji = getTopicEmoji(playlist);
                                        return (
                                            <label
                                                key={playlist}
                                                className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setTempSelectedPlaylists([...tempSelectedPlaylists, playlist]);
                                                        } else {
                                                            setTempSelectedPlaylists(tempSelectedPlaylists.filter(p => p !== playlist));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 focus:ring-offset-0"
                                                />
                                                <span className="text-sm font-medium text-slate-700 flex-1 flex items-center gap-1.5">
                                                    {emoji && <span className="opacity-70">{emoji}</span>}
                                                    {playlist}
                                                </span>
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowMultiSelectModal(false)}
                                className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setPlaylists(tempSelectedPlaylists);
                                    setShowMultiSelectModal(false);
                                }}
                                className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-all shadow-md"
                            >
                                Apply Selection ({tempSelectedPlaylists.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vocabulary Manager Modal */}
            <VocabularyManager
                isOpen={!!managingType}
                onClose={() => setManagingType(null)}
                type={managingType || 'tags'}
                items={managingType ? vocabulary[managingType] : []}
                onRefresh={loadVocab}
            />
        </>
    );
}
