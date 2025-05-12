import { Global, Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { RetrievalService } from './retrieval.service';
import { SharedModule as ServicesSharedModule } from '../../services/shared.module';

/**
 * SharedModule provides common services across all agent modules
 * Using @Global() to make these services available app-wide
 */
@Global()
@Module({
  imports: [ServicesSharedModule],
  providers: [EmbeddingsService, RetrievalService],
  exports: [EmbeddingsService, RetrievalService]
})
export class SharedModule {} 