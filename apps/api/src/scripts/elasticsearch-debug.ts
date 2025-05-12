import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
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

/**
 * Display the index mapping
 */
async function showIndexMapping() {
  try {
    console.log('Fetching index mapping...');
    const response = await esClient.get('/documents/_mapping');
    console.log('Index mapping:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching mapping:', error);
  }
}

/**
 * List all documents in the index
 */
async function listAllDocuments() {
  try {
    console.log('Listing all documents...');
    const response = await esClient.post('/documents/_search', {
      query: { match_all: {} },
      size: 100
    });
    
    const hits = response.data.hits?.hits || [];
    console.log(`Found ${hits.length} documents`);
    
    hits.forEach((hit: any, index: number) => {
      console.log(`Document ${index + 1}:`);
      console.log(`  ID: ${hit._id}`);
      console.log(`  Score: ${hit._score}`);
      console.log(`  Source: ${JSON.stringify({
        docId: hit._source.docId,
        metadata: hit._source.metadata,
        contentPreview: hit._source.content?.substring(0, 100) + '...',
        hasVector: !!hit._source.vector
      }, null, 2)}`);
    });
  } catch (error) {
    console.error('Error listing documents:', error);
  }
}

/**
 * Test vector search for a specific query
 */
async function testVectorSearch(query: string) {
  try {
    console.log(`Testing vector search for query: "${query}"`);
    
    // Generate embedding for query
    console.log('Generating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query
    });
    
    const vector = embeddingResponse.data[0].embedding;
    console.log(`Generated embedding with ${vector.length} dimensions`);
    
    // Perform search with vector
    console.log('Performing vector search...');
    const searchBody = {
      size: 5,
      _source: ["docId", "content", "metadata"],
      query: {
        script_score: {
          query: { match_all: {} },
          script: {
            source: "cosineSimilarity(params.query_vector, 'vector') + 1.0",
            params: { query_vector: vector }
          }
        }
      }
    };
    
    const filter = {
      category: "Vue.js Documentation",
      subcategory: "Vuex"
    };
    
    // Add filter
    const filteredSearchBody = {
      size: 5,
      _source: ["docId", "content", "metadata"],
      query: {
        bool: {
          must: [
            {
              script_score: {
                query: { match_all: {} },
                script: {
                  source: "cosineSimilarity(params.query_vector, 'vector') + 1.0",
                  params: { query_vector: vector }
                }
              }
            }
          ],
          filter: Object.entries(filter).map(([key, value]) => ({
            term: {
              [`metadata.${key}`]: value
            }
          }))
        }
      }
    };
    
    // Try without filter first
    const response = await esClient.post('/documents/_search', searchBody);
    
    const hits = response.data.hits?.hits || [];
    console.log(`Found ${hits.length} documents without filter`);
    
    // Then try with filter
    const filteredResponse = await esClient.post('/documents/_search', filteredSearchBody);
    
    const filteredHits = filteredResponse.data.hits?.hits || [];
    console.log(`Found ${filteredHits.length} documents with filter`);
    
    // Log all hits
    console.log('\nResults without filter:');
    hits.forEach((hit: any, index: number) => {
      console.log(`Result ${index + 1}:`);
      console.log(`  ID: ${hit._id}`);
      console.log(`  Score: ${hit._score}`);
      console.log(`  Metadata: ${JSON.stringify(hit._source.metadata)}`);
      console.log(`  Content: ${hit._source.content?.substring(0, 150)}...`);
    });
    
    console.log('\nResults with filter:');
    filteredHits.forEach((hit: any, index: number) => {
      console.log(`Result ${index + 1}:`);
      console.log(`  ID: ${hit._id}`);
      console.log(`  Score: ${hit._score}`);
      console.log(`  Metadata: ${JSON.stringify(hit._source.metadata)}`);
      console.log(`  Content: ${hit._source.content?.substring(0, 150)}...`);
    });
  } catch (error) {
    console.error('Error testing vector search:', error);
  }
}

/**
 * Test a direct text search without vectors
 */
async function testTextSearch(query: string) {
  try {
    console.log(`Testing text search for query: "${query}"`);
    
    const searchBody = {
      size: 5,
      _source: ["docId", "content", "metadata"],
      query: {
        bool: {
          must: [
            {
              match: {
                content: query
              }
            }
          ],
          filter: [
            {
              term: {
                "metadata.category": "Vue.js Documentation"
              }
            },
            {
              term: {
                "metadata.subcategory": "Vuex"
              }
            }
          ]
        }
      }
    };
    
    const response = await esClient.post('/documents/_search', searchBody);
    
    const hits = response.data.hits?.hits || [];
    console.log(`Found ${hits.length} documents with text search`);
    
    hits.forEach((hit: any, index: number) => {
      console.log(`Result ${index + 1}:`);
      console.log(`  ID: ${hit._id}`);
      console.log(`  Score: ${hit._score}`);
      console.log(`  Metadata: ${JSON.stringify(hit._source.metadata)}`);
      console.log(`  Content: ${hit._source.content?.substring(0, 150)}...`);
    });
  } catch (error) {
    console.error('Error testing text search:', error);
  }
}

// Run diagnostics
async function main() {
  console.log('Starting Elasticsearch diagnostics...');
  await showIndexMapping();
  console.log('\n-----------------------------------\n');
  await listAllDocuments();
  console.log('\n-----------------------------------\n');
  await testVectorSearch('How do Vuex getters work?');
  console.log('\n-----------------------------------\n');
  await testTextSearch('Vuex getters mutations actions');
}

main().catch(err => {
  console.error('Diagnostics failed:', err);
}); 