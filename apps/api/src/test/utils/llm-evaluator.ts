import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

/**
 * A utility class for evaluating agent responses using an LLM
 */
export class LLMEvaluator {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(LLMEvaluator.name);

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for LLM evaluator');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  /**
   * Evaluate an agent's response quality
   * 
   * @param query The user query
   * @param response The agent's response
   * @param agentType The type of agent (e.g., 'Vuex', 'Vue Core')
   * @returns Evaluation score and feedback
   */
  async evaluateResponse(
    query: string,
    response: string,
    agentType: string
  ): Promise<{ score: number; feedback: string }> {
    try {
      // First check if this is a generic "not enough information" response
      if (this.isNotEnoughInfoResponse(response)) {
        return {
          score: 0,
          feedback: "Response indicates a lack of information. The agent likely didn't retrieve content from Elasticsearch."
        };
      }

      // For real content responses, check for content relevance
      const systemPrompt = `You are an expert evaluator for ${agentType} agent responses in a Vue.js knowledge system.
Your task is to evaluate the response quality based primarily on CONTENT PRESENCE, not accuracy.
Consider:
1. Response Length - Is it more than a generic "I don't know" response?
2. Content Specificity - Does it mention specific Vue/Vuex concepts?
3. Query Relevance - Does it attempt to address the query?

Rate the response on a scale from 1 to 10, where:
1-3: Generic/empty response with little specific content
4-6: Contains some relevant content but limited
7-10: Contains substantial content relevant to the query

Focus on CONTENT PRESENCE, not accuracy. A wrong answer with content is better than no answer.`;

      const userPrompt = `Query: "${query}"

Response: "${response}"

Evaluate the quality of this response.`;

      const evaluationResponse = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const evaluationText = evaluationResponse.choices[0]?.message?.content ?? '';
      
      // Extract score (expecting a number 1-10 somewhere in the response)
      const scoreMatch = evaluationText.match(/(\d+(\.\d+)?)\s*\/\s*10|score\s*:\s*(\d+(\.\d+)?)|rating\s*:\s*(\d+(\.\d+)?)|^(\d+(\.\d+)?)$/mi);
      const score = scoreMatch 
        ? parseFloat(scoreMatch[1] || scoreMatch[3] || scoreMatch[5] || scoreMatch[7]) 
        : 5; // Default to middle score if parsing fails
      
      return {
        score,
        feedback: evaluationText.trim()
      };
    } catch (error) {
      this.logger.error(`Error evaluating response: ${error instanceof Error ? error.message : String(error)}`);
      return {
        score: 0,
        feedback: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Determine if the response is a "not enough information" message
   * 
   * @param response The agent's response text
   * @returns Whether this is a "not enough information" response
   */
  isNotEnoughInfoResponse(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    return (
      lowerResponse.includes("don't have enough information") ||
      lowerResponse.includes("don't have sufficient information") ||
      lowerResponse.includes("not enough information") ||
      lowerResponse.includes("insufficient information") ||
      lowerResponse.includes("no information available")
    );
  }
} 