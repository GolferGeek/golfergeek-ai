/**
 * MongoDB Schema Definitions for the GolferGeek AI application
 * These define the data structures stored in MongoDB
 */

// User schema for storing user information and encrypted API keys
interface AIKey {
  _id: string;
  provider: string; // 'openai', 'anthropic', etc.
  label: string;
  keyEnc: string; // Encrypted API key
  createdAt: Date;
  lastUsed?: Date;
}

export interface User {
  _id: string;
  auth0Id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  aiKeys: AIKey[];
  isAdmin: boolean;
}

// Document schema for RAG storage
export interface Document {
  _id: string;
  content: string;
  metadata: {
    title?: string;
    source?: string;
    author?: string;
    createdAt?: Date;
    tags?: string[];
    [key: string]: any; // Allow additional metadata fields
  };
  vectorId?: string; // Reference to vector in Elasticsearch
  createdAt: Date;
  updatedAt: Date;
}

// Blog post schema for the Post-Writer agent
export interface Post {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  imageUrl?: string;
  childPostIds?: string[]; // IDs of related/child posts
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// Agent execution log for tracking and debugging
export interface AgentLog {
  _id: string;
  agentId: string;
  userId?: string;
  taskId: string;
  status: 'started' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // In milliseconds
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * MongoDB collection names
 * Used to ensure consistent naming across the application
 */
export const Collections = {
  USERS: 'users',
  DOCUMENTS: 'documents',
  POSTS: 'posts',
  AGENT_LOGS: 'agent_logs',
}; 