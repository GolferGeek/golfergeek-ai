import { Controller, Get, Query, Post, Body, Logger } from '@nestjs/common';
import { VueRagService } from './vue.service';
import { SearchResult } from '../../shared/retrieval.service';

/**
 * Controller for Vue.js RAG API endpoints
 */
@Controller('agents/rag/vue')
export class VueRagController {
  private readonly logger = new Logger(VueRagController.name);
  
  constructor(private vueRagService: VueRagService) {}

  /**
   * Health check for Vue RAG endpoints
   */
  @Get()
  healthCheck() {
    this.logger.log('Vue RAG health check called');
    return { status: 'Vue RAG API is working' };
  }

  /**
   * Search for Vue.js documents by query
   * 
   * @param query Search query
   * @param maxResults Maximum number of results (optional)
   * @returns Array of relevant search results
   */
  @Get('search')
  async searchVueDocuments(
    @Query('query') query: string,
    @Query('maxResults') maxResults?: number
  ): Promise<SearchResult[]> {
    this.logger.log(`Searching for Vue documents with query: ${query}`);
    
    if (!query) {
      this.logger.warn('Search query was empty');
      return [];
    }
    
    return this.vueRagService.findVueDocuments(query, maxResults ? parseInt(String(maxResults), 10) : 3);
  }

  /**
   * Answer a question about Vue.js
   * 
   * @param question User's question
   * @returns Answer with context
   */
  @Get('ask')
  async askVueQuestion(@Query('question') question: string): Promise<{ answer: string }> {
    this.logger.log(`Answering Vue question: ${question}`);
    
    if (!question) {
      this.logger.warn('Question was empty');
      return { answer: 'Please provide a question about Vue.js.' };
    }
    
    const answer = await this.vueRagService.answerVueQuestion(question);
    return { answer };
  }

  /**
   * Alternative POST endpoint for asking questions
   * Useful for longer queries
   */
  @Post('ask')
  async askVueQuestionPost(@Body() body: { question: string }): Promise<{ answer: string }> {
    this.logger.log(`Answering Vue question (POST): ${body.question}`);
    
    if (!body.question) {
      this.logger.warn('Question was empty in POST body');
      return { answer: 'Please provide a question about Vue.js in the request body.' };
    }
    
    const answer = await this.vueRagService.answerVueQuestion(body.question);
    return { answer };
  }
} 