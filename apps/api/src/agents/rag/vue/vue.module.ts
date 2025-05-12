import { Module } from '@nestjs/common';
import { VueRagController } from './vue.controller';
import { VueRagService } from './vue.service';
import { SharedModule } from '../../shared/shared.module';

/**
 * Module for Vue-specific RAG functionality
 * Provides search and question-answering for Vue.js documentation
 */
@Module({
  imports: [SharedModule],
  controllers: [VueRagController],
  providers: [VueRagService],
  exports: [VueRagService]
})
export class VueRagModule {} 