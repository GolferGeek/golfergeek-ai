#!/usr/bin/env node

/**
 * This script extracts Vue.js documentation from the Vue.js docs repository
 * and prepares it for ingestion into a RAG system.
 * 
 * Usage: node extract-vue-docs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const INPUT_DIR = path.join(__dirname, '../tmp/vue-docs/src');
const OUTPUT_DIR = path.join(__dirname, '../docs/vue');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Clean Markdown content by removing Vue-specific syntax
 */
function cleanMarkdown(content) {
  // Remove Vue-specific component tags
  content = content.replace(/<VueSchoolLink.*?\/>/g, '');
  content = content.replace(/<div class=".*?">|<\/div>/g, '');
  content = content.replace(/<sup.*?<\/sup>/g, '');
  
  // Remove HTML comments
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove unnecessary whitespace
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return content;
}

/**
 * Process a Markdown file
 */
function processMarkdownFile(filePath, outputPath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = cleanMarkdown(content);
    
    fs.writeFileSync(outputPath, cleanedContent);
    console.log(`Wrote: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

/**
 * Recursively process all Markdown files in a directory
 */
function processDirectory(dirPath, outputBase) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const newOutputBase = path.join(outputBase, item);
      if (!fs.existsSync(newOutputBase)) {
        fs.mkdirSync(newOutputBase, { recursive: true });
      }
      processDirectory(fullPath, newOutputBase);
    } else if (item.endsWith('.md')) {
      const relativePath = path.relative(INPUT_DIR, dirPath);
      const outputDir = path.join(outputBase, relativePath);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, item);
      processMarkdownFile(fullPath, outputPath);
    }
  }
}

// Main execution
console.log('Starting Vue.js documentation extraction...');
processDirectory(INPUT_DIR, OUTPUT_DIR);
console.log('Completed Vue.js documentation extraction!'); 