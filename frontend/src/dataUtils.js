export const LANGUAGES = [
    { code: 'fr', label: 'French', flag: '/flags/fr.png' },
    { code: 'de', label: 'German', flag: '/flags/de.png' },
    { code: 'it', label: 'Italian', flag: '/flags/it.png' },
    { code: 'pt', label: 'Portuguese', flag: '/flags/pt.png' },
    { code: 'es', label: 'Spanish', flag: '/flags/es.png' },
];

export const LANGUAGE_MAP = LANGUAGES.reduce((acc, l) => {
    acc[l.code] = l;
    return acc;
}, {});

export function getTopicEmoji(text) {
    const t = text.toLowerCase();
    // Playlists / Music
    if (t.includes('house') || t.includes('techno') || t.includes('music') || t.includes('audio') || t.includes('playlist') || t.includes('mix')) return '🎧';
    if (t.includes('party') || t.includes('club') || t.includes('dance')) return '🪩';
    if (t.includes('chill') || t.includes('relax') || t.includes('lofi')) return '☕';

    // Ad Angles / Marketing
    if (t.includes('sale') || t.includes('promo') || t.includes('discount') || t.includes('offer')) return '🏷️';
    if (t.includes('urgent') || t.includes('fast') || t.includes('now') || t.includes('limited')) return '🔥';
    if (t.includes('new') || t.includes('fresh') || t.includes('launch')) return '✨';
    if (t.includes('greeting') || t.includes('welcome') || t.includes('hello') || t.includes('hi')) return '👋';
    if (t.includes('question') || t.includes('ask') || t.includes('faq')) return '❔';
    if (t.includes('info') || t.includes('tip') || t.includes('guide')) return '💡';
    if (t.includes('review') || t.includes('testimonial') || t.includes('social')) return '💬';
    if (t.includes('trust') || t.includes('safe') || t.includes('guarantee')) return '🛡️';
    if (t.includes('click') || t.includes('cta') || t.includes('link')) return '👆';

    // Generic fallback if it looks like a "Fit" or "Category"
    if (t.includes('fit') || t.includes('angle')) return '🎯';

    return null; // No emoji if no match, to keep it subtle
}
