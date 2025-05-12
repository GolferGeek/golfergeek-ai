import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// ConfigModule (imported in AppModule) automatically loads environment variables
// from the .env file at project root, so no manual dotenv logic is required here.

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
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