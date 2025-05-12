import { Controller, Get, Post, Body } from '@nestjs/common';
import { A2AControllerBase } from '../shared/a2a-controller.base';
import { OrchestratorService } from './orchestrator.service';
import { A2AAgentBaseService } from '../shared/a2a-agent-base.service';
import { AgentRegistryService } from './agent-registry.service';

/**
 * Controller for the A2A orchestrator
 * Implements the A2A protocol endpoints and orchestration capabilities
 */
@Controller('agents/a2a/orchestrator')
export class OrchestratorController extends A2AControllerBase {
  constructor(
    private orchestratorService: OrchestratorService,
    private agentRegistry: AgentRegistryService
  ) {
    super();
  }
  
  /**
   * Get the agent service that implements A2A functionality
   * Required by A2AControllerBase
   * 
   * @returns The orchestrator service instance
   */
  getAgentService(): A2AAgentBaseService {
    return this.orchestratorService;
  }
  
  /**
   * Get all available agents
   * A convenience endpoint for testing and debugging
   * 
   * @returns Array of available agent cards
   */
  @Get('agents')
  getAgents() {
    return {
      agents: this.orchestratorService.getAvailableAgents(),
      count: this.orchestratorService.getAvailableAgents().length
    };
  }
  
  /**
   * Manually trigger agent registration
   * A convenience endpoint for testing and debugging
   * 
   * @returns Result of the manual registration
   */
  @Post('register-agents')
  async registerAgents() {
    await this.orchestratorService.manuallyRegisterAgents();
    return {
      success: true,
      message: 'Manual agent registration triggered',
      agents: this.orchestratorService.getAvailableAgents(),
      count: this.orchestratorService.getAvailableAgents().length
    };
  }
} 