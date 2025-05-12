#!/usr/bin/env node

/**
 * This script ingests the Vue.js documentation into Elasticsearch for use with the RAG system.
 * 
 * Usage: node ingest-vue-docs.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { randomUUID } = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const DOCS_DIR = path.join(__dirname, '../docs/vue');
const ES_URI = process.env.ES_URI;
const ES_API_KEY = process.env.ES_API_KEY;
const DOC_INDEX = 'documents';
const VECTOR_DIMS = 1536;

// Ensure environment variables are present
if (!ES_URI || !ES_API_KEY) {
  console.error('ERROR: ES_URI and ES_API_KEY environment variables must be set.');
  process.exit(1);
}

/**
 * Initialize Elasticsearch index if it doesn't exist
 */
async function initializeIndex() {
  console.log(`Initializing Elasticsearch index at: ${ES_URI}`);
  
  try {
    // Check if index exists
    const indexExists = await axios({
      method: 'HEAD',
      url: `${ES_URI}/${DOC_INDEX}`,
      headers: getHeaders(),
      validateStatus: status => status < 500
    }).then(res => res.status === 200).catch(() => false);

    if (!indexExists) {
      // Create index with appropriate mappings
      await axios({
        method: 'PUT',
        url: `${ES_URI}/${DOC_INDEX}`,
        headers: getHeaders(),
        data: {
          mappings: {
            properties: {
              content: { type: 'text' },
              vector: {
                type: 'dense_vector',
                dims: VECTOR_DIMS,
                index: true,
                similarity: 'cosine'
              },
              metadata: { type: 'object' }
            }
          }
        }
      });
      
      console.log(`Created Elasticsearch index: ${DOC_INDEX}`);
    } else {
      console.log(`Elasticsearch index already exists: ${DOC_INDEX}`);
    }
  } catch (error) {
    console.error('Error initializing index:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Store a document vector in Elasticsearch
 */
async function storeVector(docId, vector, content, metadata = {}) {
  try {
    const response = await axios({
      method: 'PUT',
      url: `${ES_URI}/${DOC_INDEX}/_doc/${docId}`,
      headers: getHeaders(),
      data: {
        docId,
        content,
        vector,
        metadata,
        timestamp: new Date().toISOString()
      }
    });
    
    return response.data._id;
  } catch (error) {
    console.error(`Error storing vector for document ${docId}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

/**
 * Generate a simple deterministic embedding for a text
 * This is a placeholder for a real embedding API call
 */
function generateEmbedding(text) {
  // Create a deterministic but random-looking vector based on text hash
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  
  // Generate a 1536-dimension vector (OpenAI's embedding size)
  const vector = [];
  for (let i = 0; i < VECTOR_DIMS; i++) {
    // Use hash characters to generate a value between -1 and 1
    const hexChars = hash.substring(i % 32, i % 32 + 4);
    const val = (parseInt(hexChars, 16) / 0xffff) * 2 - 1;
    vector.push(val);
  }
  
  return vector;
}

/**
 * Process a Markdown file and upload to Elasticsearch
 */
async function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract title from content if available
    let title = path.basename(filePath, '.md');
    const titleMatch = content.match(/^# (.*)/m);
    if (titleMatch) {
      title = titleMatch[1];
    }
    
    // Prepare metadata
    const relativePath = path.relative(DOCS_DIR, filePath);
    const metadata = {
      title: title,
      source: relativePath,
      fileType: 'markdown',
      category: 'Vue.js Documentation'
    };
    
    // Generate document ID
    const docId = randomUUID();
    
    // Generate embedding
    const vector = generateEmbedding(content);
    
    // Store in Elasticsearch
    const result = await storeVector(docId, vector, content, metadata);
    
    if (result) {
      console.log(`Successfully indexed: ${title} (${docId})`);
      return true;
    } else {
      console.log(`Failed to index: ${title}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively process all Markdown files in a directory
 */
async function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let successCount = 0;
  let failureCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const { success, failure } = await processDirectory(fullPath);
      successCount += success;
      failureCount += failure;
    } else if (item.endsWith('.md')) {
      const success = await processFile(fullPath);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }
  }
  
  return { success: successCount, failure: failureCount };
}

/**
 * Generate headers for Elasticsearch requests
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Elasticsearch Cloud uses the format: "ApiKey <key>"
  if (ES_API_KEY.trim().startsWith('ApiKey ')) {
    headers['Authorization'] = ES_API_KEY.trim();
  } else {
    headers['Authorization'] = `ApiKey ${ES_API_KEY.trim()}`;
  }
  
  return headers;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting Vue.js documentation ingestion...');
  
  // Initialize Elasticsearch index
  await initializeIndex();
  
  // Process all documentation files
  const result = await processDirectory(DOCS_DIR);
  
  console.log(`Ingestion complete! Successfully indexed ${result.success} documents, ${result.failure} failures.`);
}

// Execute main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 