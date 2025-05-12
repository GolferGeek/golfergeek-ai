import { Module, forwardRef } from '@nestjs/common';
import { VueCoreController } from './vue-core.controller';
import { VueCoreService } from './vue-core.service';
import { A2ASharedModule } from '../shared/a2a-shared.module';
import { SharedModule } from '../../shared/shared.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

/**
 * Module for Vue Core A2A agent
 * Implements A2A-compliant RAG functionality for Vue Core
 */
@Module({
  imports: [
    A2ASharedModule,
    SharedModule,
    forwardRef(() => OrchestratorModule)
  ],
  controllers: [VueCoreController],
  providers: [VueCoreService],
  exports: [VueCoreService]
})
export class VueCoreModule {} 