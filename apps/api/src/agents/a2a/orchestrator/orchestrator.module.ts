import { Module, forwardRef } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';
import { AgentRegistryService } from './agent-registry.service';
import { A2AClientService } from './a2a-client.service';
import { A2ASharedModule } from '../shared/a2a-shared.module';
import { HttpModule } from '@nestjs/axios';
import { VueCoreModule } from '../vue-core/vue-core.module';
import { VuexModule } from '../vuex/vuex.module';
import { SharedModule } from '../../../services/shared.module';

/**
 * Module for the A2A Orchestrator
 * Provides services for agent discovery and delegation
 */
@Module({
  imports: [
    A2ASharedModule,
    HttpModule,
    SharedModule,
    forwardRef(() => VueCoreModule),
    forwardRef(() => VuexModule)
  ],
  controllers: [OrchestratorController],
  providers: [
    OrchestratorService,
    AgentRegistryService,
    A2AClientService
  ],
  exports: [OrchestratorService]
})
export class OrchestratorModule {} 