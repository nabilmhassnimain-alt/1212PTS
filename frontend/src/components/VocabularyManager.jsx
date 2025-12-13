import { useState, useRef, useEffect } from "react";
import { renameVocabularyItem, deleteVocabularyItem } from "../api";

export default function VocabularyManager({ isOpen, onClose, type, items, onRefresh }) {
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    // Reset error when state changes
    useEffect(() => { setError(null); }, [deletingItem, editingItem]);

    if (!isOpen) return null;

    const filteredItems = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));

    const handleRename = async () => {
        if (!renameValue.trim() || renameValue === editingItem) {
            setEditingItem(null);
            return;
        }
        try {
            await renameVocabularyItem(type, editingItem, renameValue.trim());
            onRefresh();
            setEditingItem(null);
        } catch (e) {
            setError("Failed to rename item");
        }
    };

    // Start delete flow
    const handleDeleteClick = (item) => {
        setDeletingItem(item);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!deletingItem) return;
        try {
            await deleteVocabularyItem(type, deletingItem);
            onRefresh();
            setDeletingItem(null);
        } catch (err) {
            setError(err.message || "Failed to delete item. Please try again.");
            console.error(err);
        }
    };

    const title = type === 'tags' ? 'Manage Ad Angles' : 'Manage Playlists';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in relative">

                {/* Main Content (when not deleting) */}
                {!deletingItem && (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">{title}</h3>
                            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Subheader / Search */}
                        <div className="p-4 border-b border-slate-100">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Search ${type}...`}
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                            />
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">No items found</div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredItems.map(item => (
                                        <div key={item} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                                            {editingItem === item ? (
                                                <div className="flex items-center gap-2 flex-1 mr-2">
                                                    <input
                                                        autoFocus
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRename();
                                                            if (e.key === 'Escape') setEditingItem(null);
                                                        }}
                                                    />
                                                    <button onClick={handleRename} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </button>
                                                    <button onClick={() => setEditingItem(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-medium text-slate-700 px-2">{item}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setRenameValue(item);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                            title="Rename Global"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(item)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete Global"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Delete Confirmation Overlay */}
                {deletingItem && (
                    <div className="p-8 text-center space-y-6 animate-scale-in">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Delete "{deletingItem}"?</h3>
                        <p className="text-sm text-slate-500 px-4">
                            This will remove <b>{deletingItem}</b> from your vocabulary list and from <b>ALL</b> texts that are currently using it. This action cannot be undone.
                        </p>
                        {error && <p className="text-sm font-bold text-red-500 bg-red-50 py-2 rounded-lg">{error}</p>}
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => setDeletingItem(null)}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all transform active:scale-95"
                            >
                                Delete Forever
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
