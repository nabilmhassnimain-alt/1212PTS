import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;
let db;

export async function connectDB() {
  if (db) return db;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('translationdb');
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function getDB() {
  if (!db) await connectDB();
  return db;
}
