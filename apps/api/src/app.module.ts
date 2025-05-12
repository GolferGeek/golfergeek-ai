import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { SharedModule } from './services/shared.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Main application module that brings together all feature modules
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    SharedModule,
    AgentsModule
  ],
  controllers: [AppController],
})
export class AppModule {} 