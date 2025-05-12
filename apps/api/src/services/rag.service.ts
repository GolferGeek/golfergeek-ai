/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * This service handles retrieving relevant documents based on queries
 * and preparing context for LLM prompts.
 */
import { getCollection } from '../utils/mongodb';
import { vectorSearch } from '../utils/elasticsearch';
import { Collections, Document } from '../schemas/mongodb';

// Mock embedding function (will be replaced with actual OpenAI call)
async function getQueryEmbedding(query: string): Promise<number[]> {
  // Create a deterministic but random-looking vector based on text hash
  const hash = Array.from(query).reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Generate a 1536-dimension vector (OpenAI's embedding size)
  const vector: number[] = [];
  for (let i = 0; i < 1536; i++) {
    // Generate a value between -1 and 1 based on hash and position
    vector.push(Math.sin(hash * (i + 1) * 0.001) * 0.5);
  }
  
  return vector;
}

/**
 * Search for relevant documents based on a query
 * 
 * @param query The search query
 * @param maxResults Maximum number of results to return
 * @param filter Optional filter for search (e.g., by source)
 * @returns Array of relevant documents
 */
export async function searchDocuments(
  query: string,
  maxResults: number = 3,
  filter?: Record<string, any>
): Promise<Document[]> {
  // Get embedding for query
  const queryVector = await getQueryEmbedding(query);
  
  // Search for similar vectors in Elasticsearch
  const searchResults = await vectorSearch(queryVector, maxResults, filter);
  
  if (searchResults.length === 0) {
    return [];
  }
  
  // Get document IDs from search results
  const docIds = searchResults.map(result => result.id);
  
  // Retrieve full documents from MongoDB
  const collection = await getCollection<Document>(Collections.DOCUMENTS);
  const documents = await collection.find({
    _id: { $in: docIds } 
  }).toArray();
  
  // Sort documents to match search result order
  const docMap = new Map<string, Document>();
  for (const doc of documents) {
    docMap.set(doc._id.toString(), doc);
  }
  
  return searchResults.map(result => docMap.get(result.id)!);
}

/**
 * Prepare a context string from retrieved documents for LLM prompting
 * 
 * @param documents Array of documents to include in context
 * @returns A formatted context string
 */
export function prepareContextForLLM(documents: Document[]): string {
  if (documents.length === 0) {
    return '';
  }
  
  let context = 'Context information from our knowledge base:\n\n';
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    context += `Document ${i + 1}: "${doc.metadata.title || 'Untitled'}"\n`;
    context += `${doc.content}\n\n`;
  }
  
  return context;
} 