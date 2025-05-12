import { Injectable } from '@nestjs/common';
import { A2AAgentBaseService } from '../shared/a2a-agent-base.service';
import { TaskStoreService } from '../shared/task-store.service';
import { 
  AgentCard, 
  Message 
} from '../types/a2a.types';
import { RetrievalService, SearchResult } from '../../shared/retrieval.service';

/**
 * Vuex A2A agent service
 * Implements RAG functionality for Vuex state management using the A2A protocol
 */
@Injectable()
export class VuexService extends A2AAgentBaseService {
  constructor(
    protected taskStore: TaskStoreService,
    private retrievalService: RetrievalService
  ) {
    super(taskStore);
  }
  
  /**
   * Get the agent card for Vuex agent
   * @returns Agent card with metadata and capabilities
   */
  getAgentCard(): AgentCard {
    return {
      name: 'Vuex A2A Agent',
      description: 'Agent providing information about Vue.js Vuex state management',
      url: 'http://localhost:3333/api/agents/a2a/vuex',
      version: '1.0.0',
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: true
      },
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      skills: [
        {
          name: 'vuex_knowledge',
          description: 'Knowledge about Vuex state management for Vue.js',
          inputModes: ['text'],
          outputModes: ['text']
        }
      ]
    };
  }
  
  /**
   * Process a message from the user and generate a response
   * 
   * @param message User's message to process
   * @param taskId ID of the current task
   * @param sessionId Optional session ID for continuing conversations
   * @returns Agent's response message
   */
  async processMessage(
    message: Message,
    taskId: string,
    sessionId?: string | null
  ): Promise<Message> {
    this.logger.log(`Processing message for task ${taskId}`);
    
    // Extract text content from message parts
    const query = this.extractTextFromMessage(message);
    
    if (!query) {
      return this.createErrorMessage('No text content found in the message');
    }
    
    try {
      // Find relevant Vuex documents
      const documents = await this.findVuexDocuments(query);
      
      if (documents.length === 0) {
        return this.createResponseMessage(
          "I don't have enough information to answer that question about Vuex state management."
        );
      }
      
      // Prepare context from documents
      const context = this.retrievalService.prepareContextForLLM(documents);
      
      // For now, return the document content directly
      // In a production version, this would use an LLM with the context
      return this.createResponseMessage(
        `Based on Vuex documentation:\n\n${context}`
      );
    } catch (error) {
      this.logger.error(`Error processing message: ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorMessage(`Error processing your request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Find Vuex related documents
   * 
   * @param query User's query
   * @param maxResults Maximum number of results to return
   * @returns Array of relevant search results
   */
  private async findVuexDocuments(
    query: string,
    maxResults: number = 3
  ): Promise<SearchResult[]> {
    this.logger.log(`Finding Vuex documents for query: ${query}`);
    
    // Filter for Vuex content
    // Adapt as needed based on your document schema
    const filter = {
      category: 'Vue.js Documentation',
      subcategory: 'Vuex'
    };
    
    try {
      const documents = await this.retrievalService.findRelevantDocuments(
        query,
        filter,
        maxResults
      );
      
      this.logger.log(`Found ${documents.length} Vuex documents`);
      return documents;
    } catch (error) {
      this.logger.error(`Error finding Vuex documents: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Extract text content from a message
   * 
   * @param message Message to extract text from
   * @returns Combined text content or empty string
   */
  private extractTextFromMessage(message: Message): string {
    let textContent = '';
    
    for (const part of message.parts) {
      if (part.type === 'text') {
        textContent += part.text + ' ';
      }
    }
    
    return textContent.trim();
  }
  
  /**
   * Create a response message with text content
   * 
   * @param text Text content for the response
   * @returns Message object
   */
  private createResponseMessage(text: string): Message {
    return {
      role: 'agent',
      parts: [{ type: 'text', text }]
    };
  }
  
  /**
   * Create an error message
   * 
   * @param errorText Error text
   * @returns Message object
   */
  private createErrorMessage(errorText: string): Message {
    return this.createResponseMessage(`Error: ${errorText}`);
  }
} 