// Load environment variables for development
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Explicitly load the .env file from the project root
const projectRoot = path.resolve(__dirname, '../../../');
const envPath = path.join(projectRoot, '.env');
console.log(`Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
  console.log(`.env file exists with size: ${fs.statSync(envPath).size} bytes`);
  
  // Read file contents to debug (masking sensitive values)
  try {
    const envContents = fs.readFileSync(envPath, 'utf8');
    const lines = envContents.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`.env file has ${lines.length} non-comment lines`);
    
    // Log key names only, not values
    console.log('Keys found:', lines.map(line => {
      const key = line.split('=')[0];
      return key ? key.trim() : null;
    }).filter(Boolean).join(', '));
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
  
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env file:', result.error);
  } else {
    console.log('Successfully loaded .env file');
  }
} else {
  console.error(`Could not find .env file at ${envPath}`);
}

console.log(`Environment variables after loading:
  - MONGODB_URI: ${process.env.MONGODB_URI ? 'Set (starts with ' + process.env.MONGODB_URI.substring(0, 15) + '...)' : 'Not set'}
  - ES_URI: ${process.env.ES_URI ? 'Set (starts with ' + process.env.ES_URI.substring(0, 15) + '...)' : 'Not set'}
  - ES_API_KEY: ${process.env.ES_API_KEY ? 'Set (length: ' + (process.env.ES_API_KEY?.length || 0) + ')' : 'Not set'}
`);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Enable CORS
  app.enableCors();
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Always use port 3333
  const port = 3333;
  
  try {
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error: any) {
    console.error(`Error starting application on port ${port}: ${error.message}`);
    process.exit(1);
  }
}

bootstrap(); 