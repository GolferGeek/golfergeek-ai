import { Controller, Get, Query, Post, Body, Logger } from '@nestjs/common';
import { VueRagService } from './vue.service';
import { SearchResult } from '@api/agents/shared/retrieval.service';
import { SearchVueDocsQueryDto } from './dto/search-vue-docs.query.dto';
import { AskVueQuestionQueryDto } from './dto/ask-vue-question.query.dto';
import { AskVueQuestionBodyDto } from './dto/ask-vue-question.body.dto';

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
    @Query() queryDto: SearchVueDocsQueryDto
  ): Promise<SearchResult[]> {
    this.logger.log(`Searching for Vue documents with query: ${queryDto.query}`);
    return this.vueRagService.findVueDocuments(queryDto.query, queryDto.maxResults);
  }

  /**
   * Answer a question about Vue.js
   * 
   * @param question User's question
   * @returns Answer with context
   */
  @Get('ask')
  async askVueQuestion(@Query() queryDto: AskVueQuestionQueryDto): Promise<{ answer: string }> {
    this.logger.log(`Answering Vue question: ${queryDto.question}`);
    const answer = await this.vueRagService.answerVueQuestion(queryDto.question);
    return { answer };
  }

  /**
   * Alternative POST endpoint for asking questions
   * Useful for longer queries
   */
  @Post('ask')
  async askVueQuestionPost(@Body() bodyDto: AskVueQuestionBodyDto): Promise<{ answer: string }> {
    this.logger.log(`Answering Vue question (POST): ${bodyDto.question}`);
    const answer = await this.vueRagService.answerVueQuestion(bodyDto.question);
    return { answer };
  }
} 