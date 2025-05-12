import { Module, forwardRef } from '@nestjs/common';
import { VuexController } from './vuex.controller';
import { VuexService } from './vuex.service';
import { A2ASharedModule } from '../shared/a2a-shared.module';
import { SharedModule } from '../../shared/shared.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

/**
 * Module for Vuex A2A agent
 * Implements A2A-compliant RAG functionality for Vue.js Vuex state management
 */
@Module({
  imports: [
    A2ASharedModule,
    SharedModule,
    forwardRef(() => OrchestratorModule)
  ],
  controllers: [VuexController],
  providers: [VuexService],
  exports: [VuexService]
})
export class VuexModule {} 