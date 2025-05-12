/**
 * Elasticsearch utility for the GolferGeek AI application
 * Provides connectivity and basic vector search operations
 */

// Note: We're using a simple fetch-based approach rather than a full client
// For production, you might want to use the official Elasticsearch client
import { Collections } from '../schemas/mongodb';
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
  
  const result = await response.json();
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
        filter: []
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
    
    const result = await response.json();
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
    
    // Ensure all returned documents have the required structure
    // Adapting the document structure to match what's expected
    const mappedResults = result.hits.hits.map((hit: any) => {
      // Check what fields are available
      console.log('Available fields in hit._source:', Object.keys(hit._source).join(', '));
      
      // If the document has a vector field, it's likely from our Elasticsearch index
      const isFromElasticsearch = hit._source.hasOwnProperty('vector');
      
      return {
        // Ensure we have an id
        id: hit._source.docId || hit._id,
        _id: hit._source.docId || hit._id,
        // Ensure we have content - this is critical for the filtering
        content: typeof hit._source.content === 'string' 
          ? hit._source.content 
          : JSON.stringify(hit._source),
        // Ensure we have metadata
        metadata: hit._source.metadata || {
          title: hit._source.title || 'Untitled Document',
          fileType: hit._source.fileType || 'unknown'
        },
        score: hit._score
      };
    });
    
    console.log('Mapped documents:', mappedResults.length);
    // Log the first mapped document for verification
    if (mappedResults.length > 0) {
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
 * Delete a vector by document ID
 * @param docId The document ID to delete
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
      headers: getHeaders()
    });
    console.log(`Deleted vector for document: ${docId}`);
  } catch (error) {
    console.error(`Error deleting vector for document ${docId}:`, 
      error instanceof Error ? error.message : String(error));
  }
}

/**
 * Generate headers for Elasticsearch requests
 * Handles API key authentication if provided
 */
function getHeaders() {
  const ES_API_KEY = process.env.ES_API_KEY;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (ES_API_KEY) {
    // Elasticsearch Cloud uses the format: "ApiKey <key>"
    // Check if the key already has "ApiKey" prefix
    if (ES_API_KEY.trim().startsWith('ApiKey ')) {
      headers['Authorization'] = ES_API_KEY.trim();
    } else {
      headers['Authorization'] = `ApiKey ${ES_API_KEY.trim()}`;
    }
    
    console.log('Using ES API key for authentication');
  } else {
    console.log('No ES API key provided');
  }
  
  return headers;
}

/**
 * Perform a search with the given query body
 */
export async function searchDocuments(queryBody: any): Promise<any> {
  const client = getEsClient();
  
  try {
    // Log more details about the request
    console.log(`Making request to: ${process.env.ES_URI}/documents/_search`);
    console.log(`Request body (truncated): ${JSON.stringify(queryBody).substring(0, 200)}...`);

    const response = await client.post('/documents/_search', queryBody);
    return response.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    return { hits: { hits: [] } };
  }
}

/**
 * Get an axios client configured for Elasticsearch
 */
export function getEsClient() {
  const esUri = process.env.ES_URI;
  const esApiKey = process.env.ES_API_KEY;

  if (!esUri || !esApiKey) {
    throw new Error('Missing Elasticsearch configuration');
  }

  return axios.create({
    baseURL: esUri,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${esApiKey}`
    }
  });
} 