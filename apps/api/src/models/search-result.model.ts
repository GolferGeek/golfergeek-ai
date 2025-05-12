/**
 * Represents a search result from Elasticsearch
 */
export interface SearchResult {
  /**
   * The Elasticsearch document ID
   */
  id: string;
  
  /**
   * The document ID in our system
   */
  docId: string;
  
  /**
   * The relevance score from Elasticsearch
   */
  score: number;
  
  /**
   * The document content
   */
  content: string;
  
  /**
   * Metadata about the document (source, category, etc.)
   */
  metadata: Record<string, any>;
} 