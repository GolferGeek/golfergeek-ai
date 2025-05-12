import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { OpenAIService } from '@api/services/openai.service';
import * as esUtils from '@api/utils/elasticsearch';

/**
 * Interface for search results
 */
export interface SearchResult {
  id: string;
  docId: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

/**
 * Generic retrieval service for RAG functionality
 * Handles vector search and document retrieval
 */
@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly openaiService: OpenAIService
  ) {}

  /**
   * Find documents relevant to a search query with optional filters
   */
  async findRelevantDocuments(
    query: string,
    filter: Record<string, any> = {},
    size: number = 3
  ): Promise<SearchResult[]> {
    this.logger.log(`Finding relevant documents for query: ${query} (size: ${size})`);
    try {
      // Generate embeddings for the query
      const embeddings = await this.openaiService.generateEmbeddings(query);
      
      // Build the search query using the utility function
      const searchQuery = esUtils.buildVectorSearchQuery(query, embeddings, filter, size);
      
      // Log search request details (using Logger)
      this.logger.debug(`ES search query: ${JSON.stringify(searchQuery).substring(0, 200)}...`);
      if (Object.keys(filter).length > 0) {
        this.logger.debug(`Applying filter: ${JSON.stringify(filter)}`);
      }
      
      // Perform the search
      const response = await esUtils.searchDocuments(searchQuery);
      
      // Log search results (using Logger)
      this.logger.debug(`Search successful, found ${response?.hits?.hits?.length || 0} results`);
      
      // Map the search results
      const results: SearchResult[] = (response?.hits?.hits || []).map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        docId: hit._source.docId,
        content: hit._source.content,
        metadata: hit._source.metadata
      }));
      
      this.logger.debug(`Mapped ${results.length} documents.`);
      
      return results;
    } catch (error) {
      this.logger.error(`Error searching for documents: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Prepare a formatted context string from documents
   * 
   * @param documents Array of search results to include in context
   * @returns Formatted context string for LLM prompt
   */
  prepareContextForLLM(documents: SearchResult[]): string {
    if (documents.length === 0) {
      return '';
    }
    
    let context = 'Context information from our knowledge base:\n\n';
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (!doc) continue;
      
      const title = doc.metadata?.title || 'Untitled';
      context += `Document ${i + 1}: "${title}"\n`;
      context += `${doc.content || 'No content available'}\n\n`;
    }
    
    return context;
  }
} 