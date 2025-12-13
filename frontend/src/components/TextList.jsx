import { useState, useMemo, useRef, useEffect } from "react";
import { deleteText } from "../api";
import { LANGUAGES, getTopicEmoji } from "../dataUtils";

export default function TextList({ texts, canCopyOnly, onApprove, isAdmin, isMod, onDeleted, onEdit }) {
    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ tags: [], playlists: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedId, setCopiedId] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const filterRef = useRef(null);

    // Filter search states
    const [playlistFilterSearch, setPlaylistFilterSearch] = useState("");
    const [tagFilterSearch, setTagFilterSearch] = useState("");

    const ITEMS_PER_PAGE = 20;

    // Reset page on search/filter/texts change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filters, texts]);

    // Extract all tags/playlists for filter dropdown
    const { allTags, allPlaylists } = useMemo(() => {
        const tagSet = new Set();
        const plSet = new Set();
        texts.forEach(t => {
            t.tags?.forEach(tag => tagSet.add(tag));
            t.playlists?.forEach(pl => plSet.add(pl));
        });
        return {
            allTags: Array.from(tagSet).sort(),
            allPlaylists: Array.from(plSet).sort()
        };
    }, [texts]);

    const filteredTexts = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        return texts
            .filter((t) => {
                // Access Control: Users can only see approved texts
                if (!isAdmin && !isMod && t.status !== 'approved' && t.status !== 'active') return false;

                const primary = (t.primary || "").toLowerCase();
                const translations = Object.values(t.translations || {}).join(" ").toLowerCase();
                const tags = (t.tags || []).join(" ").toLowerCase();
                const playlists = (t.playlists || []).join(" ").toLowerCase();
                const content = primary + " " + translations + " " + tags + " " + playlists;

                const matchSearch = content.includes(lowerSearch);
                const matchTags = filters.tags.length === 0 || filters.tags.every(tag => t.tags?.includes(tag));
                const matchPlaylists = filters.playlists.length === 0 || filters.playlists.every(pl => t.playlists?.includes(pl));

                return matchSearch && matchTags && matchPlaylists;
            })
            // Sort: Pending first for admins/mods, then by date
            .sort((a, b) => {
                if ((isAdmin || isMod)) {
                    // Treat 'pending' as higher priority than 'active'/'approved'
                    const aPending = a.status === 'pending';
                    const bPending = b.status === 'pending';
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    }, [texts, search, filters, isAdmin, isMod]);

    const handleCopy = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(key);
        setTimeout(() => setCopiedId(null), 800);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this text?')) {
            try {
                await deleteText(id);
                if (onDeleted) onDeleted(id);
            } catch (e) {
                alert(e.message || 'Failed to delete text');
            }
        }
    }

    const toggleExpand = (id) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const toggleFilter = (type, value) => {
        setFilters(prev => {
            const current = prev[type];
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [type]: next };
        });
    };

    const clearAllFilters = () => {
        setFilters({ tags: [], playlists: [] });
    };

    const activeFilterCount = filters.tags.length + filters.playlists.length;

    const renderPlaylists = (playlists) => {
        if (!playlists?.length) return <span className="text-slate-300 text-[10px] uppercase font-bold tracking-widest">-</span>;

        const MAX_VISIBLE = 1;
        const visible = playlists.slice(0, MAX_VISIBLE);
        const hiddenCount = playlists.length - MAX_VISIBLE;

        return (
            <div className="flex items-center">
                {visible.map((pl) => {
                    const emoji = getTopicEmoji(pl);
                    return (
                        <div
                            key={pl}
                            className="relative group/token flex items-center justify-center pl-2 pr-2.5 h-[22px] rounded-full bg-white/60 border border-slate-200/80 backdrop-blur-sm -ml-2 first:ml-0 hover:z-10 transition-transform hover:scale-105 shadow-sm min-w-0 max-w-[100px]"
                        >
                            <span className="text-[11px] font-bold text-slate-800 truncate uppercase tracking-tight flex items-center gap-1">
                                {emoji && <span className="opacity-80">{emoji}</span>}
                                {pl}
                            </span>
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/token:block whitespace-nowrap bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-20">
                                {pl}
                            </div>
                        </div>
                    )
                })}
                {hiddenCount > 0 && (
                    <div className="relative group/more ml-1 cursor-help z-0 hover:z-30">
                        <span className="flex items-center justify-center h-[22px] px-2 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 shadow-sm transition-transform hover:scale-105">
                            +{hiddenCount}
                        </span>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/more:block min-w-max p-2.5 bg-slate-800/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg shadow-xl z-50">
                            <div className="flex flex-col gap-1">
                                {playlists.slice(MAX_VISIBLE).map(p => (
                                    <span key={p} className="whitespace-nowrap opacity-90">{p}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">

            {/* Universal Search Bar + Filter Button */}
            <div className="flex justify-center px-4">
                <div className="flex items-center gap-3 w-full max-w-3xl">

                    {/* Search Input */}
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search primary texts, translations, playlists, or ad angles…"
                            className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-indigo-900/5 text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-300 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 focus:shadow-xl focus:shadow-indigo-500/10 focus:scale-[1.01]"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={`flex items-center gap-2 px-5 py-4 rounded-2xl border transition-all duration-300 shadow-lg backdrop-blur-xl font-bold text-sm ${filterOpen || activeFilterCount > 0
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20 hover:bg-indigo-700'
                                : 'bg-white/80 text-slate-600 border-white/60 shadow-indigo-900/5 hover:bg-white hover:border-indigo-200 hover:shadow-indigo-500/10'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 w-5 h-5 rounded-full bg-white text-indigo-600 text-xs font-bold flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Panel - Below Search Bar */}
            {filterOpen && (
                <div className="flex justify-center px-4 mt-4">
                    <div className="w-full max-w-6xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-900/10 border border-white/60 p-6 space-y-6 animate-scale-in">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">Filters</span>
                            {activeFilterCount > 0 && (
                                <button onClick={clearAllFilters} className="text-xs font-bold  text-indigo-600 hover:text-indigo-700 transition-colors">
                                    Clear all ({activeFilterCount})
                                </button>
                            )}
                        </div>

                        {/* Playlist Fit */}
                        {allPlaylists.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Playlist Fit</div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={playlistFilterSearch}
                                            onChange={(e) => setPlaylistFilterSearch(e.target.value)}
                                            placeholder="Search playlists..."
                                            className="w-48 px-3 py-1.5 pl-8 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                        <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {allPlaylists
                                        .filter(pl => pl.toLowerCase().includes(playlistFilterSearch.toLowerCase()))
                                        .map(pl => {
                                            const emoji = getTopicEmoji(pl);
                                            const isActive = filters.playlists.includes(pl);
                                            return (
                                                <button
                                                    key={pl}
                                                    onClick={() => toggleFilter('playlists', pl)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 transform active:scale-95 ${isActive
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                                                        }`}
                                                >
                                                    {emoji && <span className="mr-1">{emoji}</span>}
                                                    {pl}
                                                </button>
                                            )
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Ad Angle Fit */}
                        {allTags.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ad Angle Fit</div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={tagFilterSearch}
                                            onChange={(e) => setTagFilterSearch(e.target.value)}
                                            placeholder="Search angles..."
                                            className="w-48 px-3 py-1.5 pl-8 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        />
                                        <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {allTags
                                        .filter(tag => tag.toLowerCase().includes(tagFilterSearch.toLowerCase()))
                                        .map(tag => {
                                            const emoji = getTopicEmoji(tag);
                                            const isActive = filters.tags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    onClick={() => toggleFilter('tags', tag)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 transform active:scale-95 ${isActive
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                                                        }`}
                                                >
                                                    {emoji && <span className="mr-1">{emoji}</span>}
                                                    {tag}
                                                </button>
                                            )
                                        })}
                                </div>
                            </div>
                        )}

                        {allPlaylists.length === 0 && allTags.length === 0 && (
                            <div className="text-center text-sm text-slate-400 py-4">No filters available</div>
                        )}
                    </div>
                </div>
            )}

            {/* Active Filters Preview (if any) */}
            {activeFilterCount > 0 && (
                <div className="flex justify-center px-4">
                    <div className="flex items-center gap-2 flex-wrap max-w-3xl">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active:</span>
                        {filters.playlists.map(pl => (
                            <button
                                key={pl}
                                onClick={() => toggleFilter('playlists', pl)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors"
                            >
                                {getTopicEmoji(pl)} {pl}
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        ))}
                        {filters.tags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleFilter('tags', tag)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200 transition-colors"
                            >
                                {getTopicEmoji(tag)} {tag}
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="space-y-4">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead className="hidden md:table-header-group">
                        <tr>
                            <th className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[40%]">Primary Text</th>
                            <th className="px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Ad Angle</th>
                            <th className="px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Playlist</th>
                            <th className="px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">Translations</th>
                            <th className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[10%]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTexts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((t) => {
                            const isPending = t.status === "pending";
                            const isExpanded = expandedIds.has(t.id);
                            return (
                                <tr
                                    key={t.id}
                                    className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-transparent hover:border-indigo-50 relative z-0 hover:z-20 ${isPending ? 'ring-2 ring-amber-100' : ''}`}
                                >
                                    {/* Primary */}
                                    <td className="px-5 py-6 align-middle first:rounded-l-xl last:rounded-r-xl relative">
                                        {/* Hover Accent Bar */}
                                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex flex-col gap-1">
                                            <div
                                                onClick={() => handleCopy(t.primary, `${t.id}-primary`)}
                                                className={`relative flex-1 text-slate-900 font-semibold text-base leading-6 whitespace-pre-wrap cursor-pointer hover:text-indigo-600 transition-colors ${isExpanded ? '' : 'line-clamp-2'} ${copiedId === `${t.id}-primary` ? 'text-emerald-600' : ''}`}
                                                title="Click to copy"
                                            >
                                                {t.primary}
                                                {copiedId === `${t.id}-primary` && (
                                                    <span className="inline-flex items-center gap-1 ml-2 text-xs font-bold text-emerald-600 animate-fade-in">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        Copied
                                                    </span>
                                                )}
                                            </div>
                                            {t.primary.length > 120 && (
                                                <button onClick={() => toggleExpand(t.id)} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 uppercase tracking-wider self-start">
                                                    {isExpanded ? "Less" : "More"}
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Ad Angle */}
                                    <td className="px-2 py-6 align-middle">
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            {t.tags?.slice(0, 1).map(tag => {
                                                const emoji = getTopicEmoji(tag);
                                                return (
                                                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-slate-50 text-slate-800 border border-slate-100">
                                                        {emoji && <span className="mr-1 grayscale opacity-60">{emoji}</span>}
                                                        {tag}
                                                    </span>
                                                )
                                            })}
                                            {t.tags?.length > 1 && (
                                                <div className="relative group/more cursor-help z-0 hover:z-30">
                                                    <span className="flex items-center justify-center h-[26px] px-2 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 shadow-sm transition-transform hover:scale-105">
                                                        +{t.tags.length - 1}
                                                    </span>
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/more:block min-w-max p-2.5 bg-slate-800/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg shadow-xl z-50">
                                                        <div className="flex flex-col gap-1">
                                                            {t.tags.slice(1).map(tag => {
                                                                const emoji = getTopicEmoji(tag);
                                                                return (
                                                                    <span key={tag} className="whitespace-nowrap opacity-90 flex items-center gap-1.5">
                                                                        {emoji && <span>{emoji}</span>}
                                                                        {tag}
                                                                    </span>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Playlists */}
                                    <td className="px-2 py-6 align-middle">
                                        {renderPlaylists(t.playlists)}
                                    </td>

                                    {/* Translations */}
                                    <td className="px-2 py-6 align-middle">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {LANGUAGES.map(lang => {
                                                const has = !!t.translations?.[lang.code];
                                                const key = `${t.id}-${lang.code}`;
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => has && handleCopy(t.translations[lang.code], key)}
                                                        disabled={!has}
                                                        className={`group/flag relative px-2 h-7 rounded border flex items-center gap-1.5 transition-all
                                                    ${has
                                                                ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm hover:scale-105 hover:-translate-y-0.5'
                                                                : 'bg-transparent border-slate-100 cursor-default opacity-40'
                                                            }
                                                    ${copiedId === key ? '!bg-emerald-50 !border-emerald-200' : ''}
                                                `}
                                                        title={has ? `Copy ${lang.label}` : 'Missing'}
                                                    >
                                                        <img
                                                            src={lang.flag}
                                                            alt={lang.label}
                                                            className="w-5 h-4 object-cover rounded-sm"
                                                        />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-6 align-middle text-right first:rounded-l-xl last:rounded-r-xl">
                                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">

                                            {/* Pending Status Badge for Mods/Admins */}
                                            {t.status === 'pending' && (
                                                <span className="mr-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                                                    Pending
                                                </span>
                                            )}

                                            {/* Approve Button (Admin Only) */}
                                            {isAdmin && t.status === 'pending' && (
                                                <button onClick={() => onApprove(t.id)} className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200" title="Approve">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                            )}

                                            {/* Edit Button */}
                                            {(isAdmin || isMod) && (
                                                <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            )}

                                            {/* Delete Button (Admin Only) */}
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredTexts.length === 0 && (
                            <tr>
                                <td colSpan="5" className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        <span className="text-sm font-medium text-slate-400">No texts found</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {filteredTexts.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <div className="text-xs text-slate-400 font-bold">
                            Showing <span className="text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTexts.length)}</span> of <span className="text-slate-700">{filteredTexts.length}</span> results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-xs font-bold text-slate-600 px-2">
                                Page {currentPage} of {Math.ceil(filteredTexts.length / ITEMS_PER_PAGE)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTexts.length / ITEMS_PER_PAGE), p + 1))}
                                disabled={currentPage === Math.ceil(filteredTexts.length / ITEMS_PER_PAGE)}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
