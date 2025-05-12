# MongoDB Atlas Setup

This document covers the setup process for MongoDB Atlas, our cloud database for structured data and document storage. This service is used starting in v0.2 of the GolferGeek AI project.

## Creating a Free MongoDB Atlas Cluster

1. **Sign Up/Login to MongoDB Atlas**
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create an account or log in

2. **Create a New Project**
   - Name: `GolferGeekAI`
   - Add members (optional)

3. **Create a Cluster**
   - Choose the free M0 tier
   - Select provider (AWS/GCP/Azure) and region closest to you
   - Name the cluster: `golfergeek-prod`

4. **Security Setup**
   - Create a database user with least privileges:
     - Username: `golfergeek_app`
     - Password: (Generate a strong password and store it securely)
     - Role: `readWrite` on database `golfergeek`
   
   - Network Access:
     - For development: Allow access from anywhere (0.0.0.0/0)
     - For production: Add specific IP addresses

5. **Connection Details**
   ```
   Connection string: mongodb+srv://<username>:<password>@<cluster-url>/golfergeek?retryWrites=true&w=majority
   ```

   > **NOTE: Do not commit the actual connection string to Git. Use environment variables instead.**

## Database Structure

Our MongoDB structure includes the following collections:

| Collection | Purpose | Schema Example |
|------------|---------|----------------|
| users | User accounts with encrypted API keys | `{ _id, auth0_id, email, aiKeys: [] }` |
| posts | Blog posts created by Post-Writer agent | `{ _id, title, content, author_id, created_at }` |
| documents | Source documents for RAG | `{ _id, content, metadata: {}, vector_id }` |

## Local Development

The project includes a local MongoDB container in `docker-compose.yml`. During development, you can use:

```bash
# Connection string for local development
mongodb://admin:password@localhost:27017/golfergeek
```

## Switching Between Environments

The application uses the `MONGODB_URI` environment variable to determine which database to connect to. Set this in your `.env` file:

```
# Development (local Docker)
MONGODB_URI=mongodb://admin:password@localhost:27017/golfergeek

# Production (Atlas - DO NOT COMMIT)
# MONGODB_URI=mongodb+srv://...
```

---

*Add your actual Atlas details below after setup:*

**Atlas Connection String:** <!-- Add here but DO NOT COMMIT! -->

**Atlas Dashboard URL:** <!-- Add here -->

**Created By:** <!-- Your name -->

**Creation Date:** <!-- Date --> 