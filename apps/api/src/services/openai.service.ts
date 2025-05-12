import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor() {
    // Ensure environment variables are loaded
    dotenv.config();
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not set in environment variables');
      throw new Error('OPENAI_API_KEY is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  /**
   * Select the best agent for a query using LLM reasoning
   * 
   * @param query User query to route
   * @param agents Available agent cards with their capabilities
   * @returns Name of the best agent to handle the query
   */
  async selectAgentForQuery(
    query: string, 
    agents: Array<{name: string, description: string, skills: Array<{name: string, description: string}>}>
  ): Promise<string> {
    // If no agents provided, return empty string
    if (!agents || agents.length === 0) {
      return '';
    }
    
    // If only one agent, return it
    if (agents.length === 1) {
      return agents[0].name;
    }
    
    try {
      // Create a system prompt that explains the task
      const systemPrompt = `You are an expert agent router for a Vue.js knowledge system. 
Your task is to select the most appropriate specialized agent to handle a user query.
Analyze the user's query carefully and match it to the agent whose capabilities best address the query.
Consider the description and skills of each agent. 
Return ONLY the exact name of the best agent to handle this query - no explanation or other text.`;

      // Format agent information for the LLM
      const agentDetails = agents.map(agent => {
        const skillDescriptions = agent.skills.map(skill => 
          `    - ${skill.name}: ${skill.description}`
        ).join('\n');
        
        return `Agent: "${agent.name}"
Description: ${agent.description}
Skills:
${skillDescriptions}`;
      }).join('\n\n');

      // Build the user prompt with the query and agent information
      const userPrompt = `User Query: "${query}"

Available Agents:
${agentDetails}

Based on the query and agent capabilities, which agent should handle this query? Return only the exact agent name.`;

      // Make the API call
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Using a faster, cost-effective model for routing
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for more deterministic outputs
        max_tokens: 50  // We only need a brief response
      });

      // Extract the agent name from the response with proper null checking
      const content = response.choices[0]?.message?.content ?? '';
      const selectedAgentName = content.trim();
      
      if (!selectedAgentName) {
        this.logger.warn('Empty response from LLM for agent selection');
        return agents[0].name; // Default to first agent if no valid response
      }
      
      this.logger.log(`LLM selected agent: ${selectedAgentName}`);
      
      // Find the agent in our list (to handle case differences or slight variations)
      const matchedAgent = agents.find(agent => 
        agent.name.toLowerCase().includes(selectedAgentName.toLowerCase()) || 
        selectedAgentName.toLowerCase().includes(agent.name.toLowerCase())
      );
      
      return matchedAgent ? matchedAgent.name : agents[0].name;
    } catch (error) {
      this.logger.error(`Error selecting agent with LLM: ${error instanceof Error ? error.message : String(error)}`);
      // Fall back to first agent in case of error
      return agents[0].name;
    }
  }

  /**
   * Generate embeddings for a text query
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Error generating embeddings: ${error}`);
      throw new Error(`Failed to generate embeddings: ${error}`);
    }
  }
} 