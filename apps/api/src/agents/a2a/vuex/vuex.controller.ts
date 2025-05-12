import { Controller } from '@nestjs/common';
import { A2AControllerBase } from '../shared/a2a-controller.base';
import { VuexService } from './vuex.service';
import { A2AAgentBaseService } from '../shared/a2a-agent-base.service';

/**
 * Controller for the Vuex A2A agent
 * Implements the A2A protocol endpoints
 */
@Controller('agents/a2a/vuex')
export class VuexController extends A2AControllerBase {
  constructor(private vuexService: VuexService) {
    super();
  }
  
  /**
   * Get the agent service that implements A2A functionality
   * Required by A2AControllerBase
   * 
   * @returns The Vuex service instance
   */
  getAgentService(): A2AAgentBaseService {
    return this.vuexService;
  }
} 