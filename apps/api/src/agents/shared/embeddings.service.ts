import { Injectable } from '@nestjs/common';

/**
 * Service to handle generating embeddings for text
 * Uses OpenAI embeddings model (text-embedding-3-small) by default
 */
@Injectable()
export class EmbeddingsService {
  /**
   * Generate embeddings for text
   * Currently using a mock function, will be replaced with actual OpenAI API call
   * 
   * @param text The text to generate embeddings for
   * @returns A vector of embeddings
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Mock implementation - will be replaced with actual OpenAI API call
    // When production-ready, this will use:
    // const response = await openai.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: text,
    // });
    // return response.data[0].embedding;
    
    // For now, using a deterministic vector generator based on text hash
    const hash = Array.from(text).reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    // Generate 1536-dimension vector (OpenAI's default size)
    const vector: number[] = [];
    for (let i = 0; i < 1536; i++) {
      vector.push(Math.sin(hash * (i + 1) * 0.001) * 0.5);
    }
    
    return vector;
  }
} 