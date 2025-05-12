import { Module } from '@nestjs/common';
import { RagModule } from './rag/rag.module';
import { SharedModule } from './shared/shared.module';
import { A2AModule } from './a2a/a2a.module';

/**
 * Root module for all agent functionality
 * Organizes different agent types (RAG, MCP, Concierge, etc.)
 */
@Module({
  imports: [SharedModule, RagModule, A2AModule],
  exports: [RagModule, A2AModule]
})
export class AgentsModule {} 