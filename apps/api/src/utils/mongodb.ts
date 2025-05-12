/**
 * MongoDB connection utility for the GolferGeek AI application
 */
import { MongoClient, Db, Document } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB using connection string from environment variables
 * Reuses cached connection if available
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If we already have a connection, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Get connection string from environment
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  console.log(`Connecting to MongoDB at: ${uri.substring(0, 20)}...`);

  try {
    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    
    // Extract database name from connection string or use default
    const dbName = uri.split('/').pop()?.split('?')[0] || 'golfergeek';
    const db = client.db(dbName);
    
    console.log(`Successfully connected to MongoDB database: ${dbName}`);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Close MongoDB connection
 * Useful for graceful shutdown
 */
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

/**
 * Get MongoDB collection helper
 * Provides type safety for collection access
 * @param collectionName The name of the collection to access
 * @returns A typed MongoDB collection
 */
export async function getCollection<T extends Document>(collectionName: string) {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
} 