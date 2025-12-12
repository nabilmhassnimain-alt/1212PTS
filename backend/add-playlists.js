import { addVocabularyItem, getAllTexts } from './dataStore.js';

const playlists = [
    "Gaming",
    "Car",
    "Techno Remix",
    "Nightcore",
    "Workout",
    "Gym Phonk",
    "Gym Hardstyle",
    "Brazilian Phonk",
    "Green Phonk Aura",
    "WINTER ARC",
    "Deep House #1",
    "Summer Vibes (Deep.)",
    "Sad Songs",
    "Cafe Music",
    "Coffee Music",
    "AFRO HOUSE",
    "New Afro House remix (2nd)",
    "AfroBeats mix",
    "Office chill",
    "Restaurant Music",
    "Pilates Flow",
    "Sax House",
    "Relaxing Music",
    "Salon Music",
    "Zara House",
    "Beach Music",
    "Temazos Fiesta",
    "interestellar ambient",
    "HIPHOP MIX",
    "Shop Music / Shopping",
    "Salao de Beleza",
    "Badass Villain Songs",
    "Dark Romance (TIKTOK ONLY)",
    "Dinner Chill Music",
    "Música Alegre para Cafés",
    "Sluttiest most attractive songs",
    "Workout Remix (female version)",
    "Chill House Mix 2025 Chillout",
    "Deep House #2",
    "Autumn",
    "Hardstyle Remix",
    "Ibiza Summer",
    "Lounge",
    "blade runner ambient",
    "calming sleep music",
    "Sped Up Songs",
    "Gym Techno",
    "ambient music",
    "TikTok Playlist",
    "King",
    "Villain",
    "Badass",
    "Reggaeton",
    "Running Motivation",
    "Rap Music",
    "Christmas",
    "EDM MIX",
    "Dark Academia New",
    "Book Reading",
    "classical baby",
    "portuguese baby",
    "Dark Academia 2024",
    "Lofi Playlist",
    "Sex Playlist",
    "bedroom playlist",
    "Hype Gym Workout",
    "Workout Playlist 2025",
    "GYM RAP GYM BEASTMODE",
    "Hot Latina Workout",
    "hot gym girls",
    "baby einschlafmusik (lullaby)",
    "Morning Vibes",
    "Cleaning Mix",
    "House Mix",
    "Americain Rap",
    "Playa Mix 2025",
    "90s Hip Hop",
    "Apero / Cocktail",
    "BBQ Summer Vibes"
];

console.log(`Adding ${playlists.length} playlists...`);

// Get current playlists to avoid duplicates
const data = getAllTexts();
const existingPlaylists = new Set(data.vocabulary?.playlists || []);

let added = 0;
let skipped = 0;

for (const playlist of playlists) {
    if (existingPlaylists.has(playlist)) {
        console.log(`⏭️  Skipped (already exists): ${playlist}`);
        skipped++;
    } else {
        try {
            addVocabularyItem('playlists', playlist);
            console.log(`✅ Added: ${playlist}`);
            added++;
        } catch (error) {
            console.log(`❌ Failed to add: ${playlist}`, error.message);
        }
    }
}

console.log(`\n✅ Done! Added ${added} new playlists, skipped ${skipped} existing.`);
