import { Module } from '@nestjs/common';
import { TaskStoreService } from './task-store.service';

/**
 * Shared module for A2A protocol functionality
 * Provides core services for A2A-compliant agents
 */
@Module({
  providers: [TaskStoreService],
  exports: [TaskStoreService]
})
export class A2ASharedModule {} 