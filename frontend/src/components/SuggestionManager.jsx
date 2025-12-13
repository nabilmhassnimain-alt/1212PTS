import { useState, useEffect } from 'react';
import { fetchSuggestions, updateSuggestionStatus, deleteSuggestion } from '../api';

export default function SuggestionManager() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (isExpanded) {
            loadSuggestions();
        }
    }, [isExpanded]);

    async function loadSuggestions() {
        setLoading(true);
        try {
            const data = await fetchSuggestions();
            setSuggestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(id, newStatus) {
        try {
            await updateSuggestionStatus(id, newStatus);
            setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        } catch (e) {
            alert("Failed to update status");
        }
    }

    async function handleDelete(id) {
        if (!confirm("Delete this suggestion?")) return;
        try {
            await deleteSuggestion(id);
            setSuggestions(prev => prev.filter(s => s.id !== id));
        } catch (e) {
            alert("Failed to delete");
        }
    }

    const pendingCount = suggestions.filter(s => s.status === 'pending').length;

    return (
        <div className={`bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg shadow-amber-900/5 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? '' : 'hover:bg-white/70'}`}>
            {/* Header */}
            <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer select-none border-b border-transparent hover:bg-white/40 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white shadow-sm ${isExpanded ? 'bg-amber-500' : 'bg-slate-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Suggestion Box</h3>
                    {!isExpanded && pendingCount > 0 && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold ml-2">
                            {pendingCount} new
                        </span>
                    )}
                </div>
                <button className="text-slate-400 hover:text-amber-600 transition-colors">
                    <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 border-t border-white/50">
                    {loading ? (
                        <div className="text-center text-slate-400 text-xs py-4">Loading suggestions...</div>
                    ) : suggestions.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm italic py-4">No suggestions yet.</div>
                    ) : (
                        <div className="space-y-3 custom-scrollbar max-h-96 overflow-y-auto pr-2">
                            {suggestions.map(suggestion => (
                                <div
                                    key={suggestion.id}
                                    className={`flex gap-3 p-4 rounded-xl border transition-all ${suggestion.status === 'implemented'
                                        ? 'bg-emerald-50/50 border-emerald-100 opacity-75'
                                        : 'bg-white/80 border-amber-100 shadow-sm'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${suggestion.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                {new Date(suggestion.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-indigo-400 px-1.5 py-0.5 bg-indigo-50 rounded">
                                                {suggestion.author?.label ? `${suggestion.author.label} (${suggestion.author.role})` : suggestion.author?.role || 'User'}
                                            </span>                                        </div>
                                        <p className={`text-sm text-slate-700 whitespace-pre-wrap ${suggestion.status === 'implemented' ? 'line-through text-slate-500' : ''}`}>
                                            {suggestion.content}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 justify-start">
                                        {suggestion.status !== 'implemented' ? (
                                            <button
                                                onClick={() => handleStatusChange(suggestion.id, 'implemented')}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Mark Implemented"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusChange(suggestion.id, 'pending')}
                                                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"
                                                title="Mark Pending"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(suggestion.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
