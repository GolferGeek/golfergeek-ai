import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Configure OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure Elasticsearch
const esUri = process.env.ES_URI;
const esApiKey = process.env.ES_API_KEY;

if (!esUri || !esApiKey) {
  console.error('Missing Elasticsearch configuration');
  process.exit(1);
}

// Configure Elasticsearch axios client
const esClient = axios.create({
  baseURL: esUri,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `ApiKey ${esApiKey}`
  }
});

// Function to generate embeddings for a text
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.slice(0, 8000) // Limit to avoid token limits
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to check if index exists
async function indexExists(indexName: string): Promise<boolean> {
  try {
    const response = await esClient.head(`/${indexName}`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Create Elasticsearch index if it doesn't exist
async function createIndexIfNotExists(indexName: string): Promise<void> {
  const exists = await indexExists(indexName);
  
  if (!exists) {
    console.log(`Creating index: ${indexName}`);
    try {
      await esClient.put(`/${indexName}`, {
        mappings: {
          properties: {
            docId: { type: 'keyword' },
            content: { type: 'text' },
            vector: {
              type: 'dense_vector',
              dims: 1536 // Ada-002 embedding dimensions
            },
            metadata: {
              properties: {
                title: { type: 'text' },
                source: { type: 'keyword' },
                category: { type: 'keyword' },
                subcategory: { type: 'keyword' }
              }
            }
          }
        }
      });
      console.log(`Index ${indexName} created successfully`);
    } catch (error) {
      console.error('Error creating index:', error);
      throw error;
    }
  } else {
    console.log(`Index ${indexName} already exists`);
  }
}

// Function to ingest markdown file into Elasticsearch
async function ingestMarkdown(filePath: string, indexName: string, metadata: any): Promise<void> {
  console.log(`Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Generate embedding for the content
  console.log('Generating embedding...');
  const vector = await generateEmbedding(content);
  
  // Create document with metadata and vector
  const document = {
    docId: uuidv4(),
    content,
    vector,
    metadata
  };
  
  // Index document in Elasticsearch
  console.log('Indexing document in Elasticsearch...');
  try {
    const response = await esClient.post(`/${indexName}/_doc`, document);
    console.log(`Document indexed with ID: ${response.data._id}`);
  } catch (error) {
    console.error('Error indexing document:', error);
    throw error;
  }
}

// Main function to run the ingest process
async function main() {
  const indexName = 'documents';
  
  try {
    // Create index if it doesn't exist
    await createIndexIfNotExists(indexName);
    
    // Path to Vuex documentation
    const vuexDocsPath = path.resolve(__dirname, '../../../../docs/ingest/vuex-state-management.md');
    
    // Ingest Vuex documentation
    await ingestMarkdown(vuexDocsPath, indexName, {
      title: 'Vuex State Management Guide',
      source: 'Vue.js Documentation',
      category: 'Vue.js Documentation',
      subcategory: 'Vuex'
    });
    
    console.log('Vuex documentation ingested successfully');
  } catch (error) {
    console.error('Error in ingest process:', error);
  }
}

// Run the main function
main().then(() => {
  console.log('Ingest process completed');
}).catch(err => {
  console.error('Ingest process failed:', err);
  process.exit(1);
}); 