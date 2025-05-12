/**
 * Elasticsearch utility for the GolferGeek AI application
 * Provides connectivity and basic vector search operations
 */

// Note: We're using a simple fetch-based approach rather than a full client
// For production, you might want to use the official Elasticsearch client
// import { Collections } from '../schemas/mongodb'; // This will be an issue, needs to be from @api or passed in
import axios from 'axios';

// Vector dimensions for OpenAI embeddings
const VECTOR_DIMS = 1536;

// Document index name
const DOC_INDEX = 'documents';

/**
 * Initialize Elasticsearch index for document vectors
 * Creates the index if it doesn't exist
 */
export async function initializeIndex() {
  const ES_URI = process.env.ES_URI;
  
  if (!ES_URI) {
    console.error('Elasticsearch URI is not defined. Please check your environment variables.');
    return;
  }

  console.log(`Initializing Elasticsearch index at: ${ES_URI}`);
  
  // Check if index exists
  const indexExists = await fetch(`${ES_URI}/${DOC_INDEX}`, {
    method: 'HEAD',
    headers: getHeaders(),
  }).then(res => res.ok).catch(() => false);

  if (!indexExists) {
    // Create index with appropriate mappings
    await fetch(`${ES_URI}/${DOC_INDEX}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
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
      })
    });
    
    console.log(`Created Elasticsearch index: ${DOC_INDEX}`);
  }
}

/**
 * Store a document vector in Elasticsearch
 * @param docId MongoDB document ID to link with the vector
 * @param vector The embedding vector (usually from OpenAI)
 * @param content The full document content
 * @param metadata Additional metadata to store with the vector
 * @returns The Elasticsearch document ID
 */
export async function storeVector(
  docId: string, 
  vector: number[], 
  content: string,
  metadata: Record<string, any> = {}
) {
  const ES_URI = process.env.ES_URI;
  
  if (!ES_URI) {
    console.error('Elasticsearch URI is not defined. Please check your environment variables.');
    return null;
  }

  console.log(`Storing vector in Elasticsearch at: ${ES_URI}`);
  
  const response = await fetch(`${ES_URI}/${DOC_INDEX}/_doc/${docId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      docId,
      content,
      vector,
      metadata,
      timestamp: new Date().toISOString()
    })
  });
  
  const result: any = await response.json();
  return result._id;
}

/**
 * Build vector search query 
 */
export function buildVectorSearchQuery(query: string, embeddings: number[], filter: Record<string, any> = {}, size: number = 3): any {
  // Create the base script score query
  const queryBody: any = {
    size,
    _source: ["docId", "content", "metadata"],
    query: {
      script_score: {
        query: { match_all: {} },
        script: {
          source: "cosineSimilarity(params.query_vector, 'vector') + 1.0",
          params: { query_vector: embeddings }
        }
      }
    }
  };

  // Add filter if provided
  if (Object.keys(filter).length > 0) {
    // Replace with a bool query that combines the script_score and filter
    queryBody.query = {
      bool: {
        must: [
          {
            script_score: {
              query: { match_all: {} },
              script: {
                source: "cosineSimilarity(params.query_vector, 'vector') + 1.0",
                params: { query_vector: embeddings }
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
    };
  }

  return queryBody;
}

/**
 * Perform vector search using k-nearest neighbors algorithm
 * @param vector Query vector (usually from OpenAI)
 * @param k Number of results to return
 * @param filter Optional filter to apply
 * @returns Array of document data with content and metadata
 */
export async function vectorSearch(
  vector: number[], 
  k: number = 3,
  filter?: Record<string, any>
) {
  const ES_URI = process.env.ES_URI;
  
  if (!ES_URI) {
    console.error('Elasticsearch URI is not defined. Please check your environment variables.');
    return [];
  }

  console.log(`Elasticsearch search request to: ${ES_URI}`);
  
  // Create a simpler query that works with Elasticsearch 8.x
  let searchBody: any = {
    size: k,
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
  
  // Add filter if provided in a compatible way
  if (filter) {
    // Convert to a must + filter query
    searchBody.query = {
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
        filter: [] as any[]
      }
    };
    
    // Add each filter condition
    Object.entries(filter).forEach(([key, value]) => {
      searchBody.query.bool.filter.push({
        term: {
          [`metadata.${key}`]: value
        }
      });
    });
    
    console.log(`Applying filter: ${JSON.stringify(filter)}`);
  }
  
  try {
    // Get headers with proper authentication
    const headers = getHeaders();
    console.log('Headers prepared:', Object.keys(headers).join(', '));
    
    const url = `${ES_URI}/${DOC_INDEX}/_search`;
    console.log(`Making request to: ${url}`);
    
    // Log actual request body for debugging (truncated)
    const requestBody = JSON.stringify(searchBody);
    console.log(`Request body (truncated): ${requestBody.substring(0, 200)}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: requestBody
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Elasticsearch error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const result: any = await response.json();
    console.log(`Search successful, found ${result.hits?.hits?.length || 0} results`);
    
    if (!result.hits || !result.hits.hits) {
      console.warn('No hits found in Elasticsearch response');
      return [];
    }
    
    // Log the raw structure of the first hit for debugging
    if (result.hits.hits.length > 0) {
      console.log('First hit structure:', JSON.stringify(result.hits.hits[0]._source, null, 2));
      console.log('First hit _id:', result.hits.hits[0]._id);
    }
    
    const mappedResults = result.hits.hits.map((hit: any) => {
      // Log the structure of each hit._source
      console.log('Available fields in hit._source:', Object.keys(hit._source).join(', '));

      return {
        id: hit._id,
        score: hit._score,
        docId: hit._source.docId, // Assuming docId is directly available
        content: hit._source.content,
        metadata: hit._source.metadata
      };
    });

    if(mappedResults.length > 0){
      console.log('Mapped documents:', mappedResults.length);
      console.log('First mapped document:', JSON.stringify(mappedResults[0], null, 2));
    }
    return mappedResults;

  } catch (error) {
    console.error('Error with Elasticsearch request:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return [];
  }
}

/**
 * Delete a document vector from Elasticsearch
 * @param docId MongoDB document ID to delete
 */
export async function deleteVector(docId: string) {
  const ES_URI = process.env.ES_URI;
  
  if (!ES_URI) {
    console.error('Elasticsearch URI is not defined. Please check your environment variables.');
    return;
  }
  
  try {
    await fetch(`${ES_URI}/${DOC_INDEX}/_doc/${docId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    console.log(`Deleted vector for document: ${docId}`);
  } catch (error) {
    console.error(`Error deleting vector for document ${docId}:`,
                  error instanceof Error ? error.message : String(error));
  }
}

/**
 * Helper to get headers with optional API key authentication
 * @returns Headers object
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  const ES_API_KEY = process.env.ES_API_KEY;
  
  if (ES_API_KEY) {
    console.log('Using ES API key for authentication');
    headers['Authorization'] = `ApiKey ${ES_API_KEY}`;
  } else {
    console.log('No ES API key provided');
  }
  
  return headers;
}


/**
 * Generic search function for Elasticsearch
 * @param queryBody The full query body to send to Elasticsearch
 * @returns The raw Elasticsearch response
 */
export async function searchDocuments(queryBody: any): Promise<any> {
  try {
    const url = `${process.env.ES_URI}/${DOC_INDEX}/_search`;
    console.log(`Making request to: ${process.env.ES_URI}/documents/_search`);
    console.log(`Request body (truncated): ${JSON.stringify(queryBody).substring(0, 200)}...`);
    const response = await axios.post(url, queryBody, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

/**
 * Get an instance of the Elasticsearch client (using axios for now)
 * This is a placeholder for a more robust client setup if needed
 */
export function getEsClient() {
  const esUri = process.env.ES_URI;
  const esApiKey = process.env.ES_API_KEY;
  if (!esUri) {
    throw new Error('Elasticsearch URI (ES_URI) is not defined in environment variables.');
  }

  return {
    search: async (params: { index: string; body: any }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (esApiKey) {
        headers['Authorization'] = `ApiKey ${esApiKey}`;
      }
      return axios.post(`${esUri}/${params.index}/_search`, params.body, { headers });
    },
    // Add other client methods as needed (e.g., index, delete, update)
  };
} 