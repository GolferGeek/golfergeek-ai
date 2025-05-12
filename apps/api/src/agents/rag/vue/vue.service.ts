import { Injectable, Logger } from '@nestjs/common';
import { RetrievalService, SearchResult } from '../../shared/retrieval.service';

/**
 * Vue-specific RAG service that handles retrieval and generation
 * for Vue.js documentation and examples
 */
@Injectable()
export class VueRagService {
  private readonly logger = new Logger(VueRagService.name);
  
  constructor(private retrievalService: RetrievalService) {}

  /**
   * Find Vue.js related documents based on a query
   * 
   * @param query User's query about Vue.js
   * @param maxResults Maximum number of results to return
   * @returns Relevant Vue.js documents
   */
  async findVueDocuments(query: string, maxResults: number = 3): Promise<SearchResult[]> {
    this.logger.log(`Finding Vue documents for query: ${query}`);
    
    // Apply a less restrictive filter to find Vue.js documents
    const filter = {
      // The metadata likely has "vue" in the title or filename
      // But we'll keep the filter empty to get all results for now
    };
    
    try {
      const documents = await this.retrievalService.findRelevantDocuments(query, filter, maxResults);
      this.logger.log(`Found ${documents.length} Vue documents`);
      
      // Filter out any null documents
      const validDocuments = documents.filter(doc => doc !== null);
      this.logger.log(`After filtering nulls: ${validDocuments.length} valid documents`);
      
      return validDocuments;
    } catch (error) {
      this.logger.error(`Error finding Vue documents: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Generate a response for a Vue.js related question
   * 
   * @param query User's question about Vue.js
   * @returns Answer with context from relevant documents
   */
  async answerVueQuestion(query: string): Promise<string> {
    this.logger.log(`Answering Vue question: ${query}`);
    
    // Retrieve relevant documents
    const documents = await this.findVueDocuments(query);
    
    if (documents.length === 0) {
      return "I don't have enough information to answer that question about Vue.js.";
    }
    
    // Prepare context from documents
    const context = this.retrievalService.prepareContextForLLM(documents);
    
    // In the future, we'll call an LLM here with the context and query
    // For now, just return a mock response with the context
    return `Based on the Vue.js documentation, here's what I found:
    
${context}

Note: In the future, this will be processed through an LLM to generate a more coherent answer.`;
  }
} 