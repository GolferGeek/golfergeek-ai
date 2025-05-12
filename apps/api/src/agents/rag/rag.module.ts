import { Module } from '@nestjs/common';
import { VueRagModule } from './vue/vue.module';

/**
 * RAG module that brings together different RAG implementations
 * Currently only contains Vue RAG, but will add more in the future
 */
@Module({
  imports: [VueRagModule],
  exports: [VueRagModule]
})
export class RagModule {} 