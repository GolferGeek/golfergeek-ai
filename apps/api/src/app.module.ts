import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { SharedModule } from './services/shared.module';

/**
 * Main application module that brings together all feature modules
 */
@Module({
  imports: [
    SharedModule, // Import shared module with OpenAI service
    AgentsModule
  ],
  controllers: [AppController],
})
export class AppModule {} 