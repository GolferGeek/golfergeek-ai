/**
 * Document Ingestion Script for RAG
 * 
 * This script:
 * 1. Reads documents from a directory
 * 2. Splits them into chunks
 * 3. Creates embeddings via OpenAI
 * 4. Stores documents in MongoDB
 * 5. Stores vectors in Elasticsearch
 * 
 * Usage:
 * ts-node ingest-documents.ts /path/to/documents
 */

// Load environment variables from .env file
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { connectToDatabase, getCollection } from '../utils/mongodb';
import * as esUtils from '../utils/elasticsearch';
import { Collections, Document } from '../schemas/mongodb';
import pdfParse from 'pdf-parse';

// Force environment variables to be loaded from parent .env file if not already set
const projectRoot = path.resolve(__dirname, '../../../../');
const envPath = path.join(projectRoot, '.env');
console.log(`Checking for .env at: ${envPath}`);
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Simple document splitter (in a real application, this would be more sophisticated)
function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  
  // Split on paragraphs
  const paragraphs = text.split('\n\n');
  
  let currentChunk = '';
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Mock OpenAI embeddings for now (will be replaced with actual API call)
async function getEmbedding(text: string): Promise<number[]> {
  // Create a deterministic but random-looking vector based on text hash
  const hash = Array.from(text).reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Generate a 1536-dimension vector (OpenAI's embedding size)
  const vector: number[] = [];
  for (let i = 0; i < 1536; i++) {
    // Generate a value between -1 and 1 based on hash and position
    vector.push(Math.sin(hash * (i + 1) * 0.001) * 0.5);
  }
  
  return vector;
}

// Extract text from PDF files
async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error(`Error parsing PDF ${filePath}:`, error);
    return '';
  }
}

// Process a document (any supported format) and ingest it
async function processDocument(filePath: string) {
  console.log(`Processing ${filePath}...`);
  
  // Get file content based on type
  const fileExt = path.extname(filePath).toLowerCase();
  let content = '';
  
  if (fileExt === '.pdf') {
    content = await extractTextFromPDF(filePath);
  } else {
    // Text-based files
    content = fs.readFileSync(filePath, 'utf-8');
  }
  
  if (!content || content.trim().length === 0) {
    console.warn(`No content extracted from ${filePath}, skipping...`);
    return;
  }
  
  // Extract basic metadata from filename
  const fileName = path.basename(filePath);
  const title = fileName.replace(fileExt, '');
  
  // Split into chunks
  const chunks = splitIntoChunks(content);
  console.log(`Split into ${chunks.length} chunks`);
  
  // Connect to MongoDB
  const { db } = await connectToDatabase();
  const collection = await getCollection<Document>(Collections.DOCUMENTS);
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Create document in MongoDB
    const doc: Omit<Document, '_id'> = {
      content: chunk,
      metadata: {
        title: `${title} (${i + 1}/${chunks.length})`,
        source: filePath,
        fileType: fileExt.replace('.', ''),
        createdAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(doc as any);
    const docId = result.insertedId.toString();
    
    // Get embedding for this chunk
    const vector = await getEmbedding(chunk);
    
    // Store in Elasticsearch
    const vectorId = await esUtils.storeVector(docId, vector, {
      title: doc.metadata.title,
      source: doc.metadata.source,
      fileType: doc.metadata.fileType
    });
    
    // Update MongoDB document with vector ID
    await collection.updateOne(
      { _id: result.insertedId },
      { $set: { vectorId: vectorId } }
    );
    
    console.log(`Processed chunk ${i + 1}/${chunks.length}, ID: ${docId}`);
  }
}

async function main() {
  try {
    // Log environment variables for debugging
    console.log("Environment variables:");
    console.log("- MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
    console.log("- ES_URI:", process.env.ES_URI ? "Set" : "Not set");
    console.log("- ES_KEY:", process.env.ES_KEY ? "Set" : "Not set");
    
    // Get directory from command line
    const docsDir = process.argv[2];
    if (!docsDir) {
      console.error('Please provide a directory path');
      process.exit(1);
    }
    
    // Check if directory exists
    if (!fs.existsSync(docsDir) || !fs.statSync(docsDir).isDirectory()) {
      console.error(`${docsDir} is not a valid directory`);
      process.exit(1);
    }
    
    // Initialize Elasticsearch
    await esUtils.initializeIndex();
    
    // Process all supported files
    const files = fs.readdirSync(docsDir);
    for (const file of files) {
      const filePath = path.join(docsDir, file);
      if (fs.statSync(filePath).isFile() && /\.(txt|md|mdx|pdf)$/i.test(file)) {
        await processDocument(filePath);
      } else {
        console.log(`Skipping unsupported file: ${file}`);
      }
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 