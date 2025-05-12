import { Controller } from '@nestjs/common';
import { A2AControllerBase } from '../shared/a2a-controller.base';
import { VueCoreService } from './vue-core.service';
import { A2AAgentBaseService } from '../shared/a2a-agent-base.service';

/**
 * Controller for the Vue Core A2A agent
 * Implements the A2A protocol endpoints
 */
@Controller('agents/a2a/vue-core')
export class VueCoreController extends A2AControllerBase {
  constructor(private vueCoreService: VueCoreService) {
    super();
  }
  
  /**
   * Get the agent service that implements A2A functionality
   * Required by A2AControllerBase
   * 
   * @returns The Vue Core service instance
   */
  getAgentService(): A2AAgentBaseService {
    return this.vueCoreService;
  }
} 