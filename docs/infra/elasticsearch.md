# Elasticsearch Cloud Setup

This document covers the setup process for Elasticsearch Cloud, our vector database for Retrieval-Augmented Generation (RAG). This service is used starting in v0.2 of the GolferGeek AI project.

## Setting Up Elasticsearch Cloud

1. **Sign Up/Login to Elastic Cloud**
   - Visit [Elastic Cloud](https://cloud.elastic.co/)
   - Create an account or log in

2. **Create a Deployment**
   - Name: `GolferGeekAI`
   - Hardware profile: "I/O Optimized"
   - Region: Choose nearest to you
   - Version: Latest (8.x)
   - Size: "Essentials" (1 GB) for startup
   
3. **Security Setup**
   - Record the generated elastic username and password
   - Create a separate API key specifically for our application with limited privileges:
     - Go to Management > Security > API Keys
     - Create key with name: `golfergeek-app-key`
     - Role: `monitor` and `manage_index_templates` privileges

4. **Connection Details**
   ```
   Elasticsearch Endpoint: https://<deployment-id>.<region>.aws.cloud.es.io:9243
   Username: elastic
   Password: <generated-password>
   API Key: <generated-api-key>
   ```

   > **NOTE: Do not commit these credentials to Git. Use environment variables instead.**

## Index Setup for Vector Search

1. **Create Index for Document Embeddings**
   ```json
   PUT /documents
   {
     "mappings": {
       "properties": {
         "content": { "type": "text" },
         "vector": {
           "type": "dense_vector",
           "dims": 1536,
           "index": true,
           "similarity": "cosine"
         },
         "metadata": { "type": "object" }
       }
     }
   }
   ```

2. **Example Query**
   ```json
   GET /documents/_search
   {
     "knn": {
       "field": "vector", 
       "query_vector": [0.1, 0.2, ...], 
       "k": 5,
       "num_candidates": 50
     }
   }
   ```

## Local Development

The project includes a local Elasticsearch container in `docker-compose.yml`. During development, use:

```bash
# Connection string for local development
http://localhost:9200
```

Kibana UI: http://localhost:5601

## Switching Between Environments

The application uses the `ES_URI` environment variable to determine which Elasticsearch instance to connect to. Set this in your `.env` file:

```
# Development (local Docker)
ES_URI=http://localhost:9200

# Production (Elastic Cloud - DO NOT COMMIT)
# ES_URI=https://...
# ES_API_KEY=...
```

## Testing the Connection

```bash
# Test local connection
curl -X GET "localhost:9200"

# Test cloud connection
curl -X GET -u "elastic:<password>" "https://<deployment-id>.<region>.aws.cloud.es.io:9243"
```

---

*Add your actual Elastic Cloud details below after setup:*

**Elastic Cloud Endpoint:** <!-- Add here but DO NOT COMMIT! -->

**Kibana URL:** <!-- Add here -->

**Created By:** <!-- Your name -->

**Creation Date:** <!-- Date --> 