import { Module } from '@nestjs/common';
import { A2ASharedModule } from './shared/a2a-shared.module';
import { VueCoreModule } from './vue-core/vue-core.module';
import { VuexModule } from './vuex/vuex.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';

/**
 * Main A2A module that brings together all A2A components
 * Provides specialized agents and an orchestrator
 */
@Module({
  imports: [
    A2ASharedModule,
    VueCoreModule,
    VuexModule,
    OrchestratorModule
  ],
  exports: [
    A2ASharedModule,
    VueCoreModule,
    VuexModule,
    OrchestratorModule
  ]
})
export class A2AModule {} 