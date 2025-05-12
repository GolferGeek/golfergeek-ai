import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AgentCard } from '../types/a2a.types';
import { A2AClientService } from './a2a-client.service';

/**
 * A registry for A2A agents
 * Discovers and maintains a registry of available agents
 */
@Injectable()
export class AgentRegistryService implements OnModuleInit {
  private readonly logger = new Logger(AgentRegistryService.name);
  private agents: Map<string, AgentCard> = new Map();
  
  // List of URLs to check for agents
  private readonly agentUrls = [
    `http://localhost:3333/api/agents/a2a/vue-core`,
    `http://localhost:3333/api/agents/a2a/vuex`
  ];
  
  // Configuration for discovery retries
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_DELAY_MS = 1000;
  private readonly RETRY_DELAY_MS = 2000;
  
  constructor(private a2aClient: A2AClientService) {}
  
  /**
   * Initialize the registry when the module is loaded
   */
  async onModuleInit() {
    // Delay initial discovery to ensure HTTP server is ready
    setTimeout(() => this.discoverAgentsWithRetry(), this.INITIAL_DELAY_MS);
  }
  
  /**
   * Discover agents with retry logic
   */
  async discoverAgentsWithRetry(retryCount = 0): Promise<void> {
    this.logger.log(`Attempting to discover agents (attempt ${retryCount + 1} of ${this.MAX_RETRIES + 1})...`);
    
    try {
      await this.discoverAgents();
      
      // If no agents were found and we haven't reached max retries, try again
      if (this.agents.size === 0 && retryCount < this.MAX_RETRIES) {
        this.logger.log(`No agents found, will retry in ${this.RETRY_DELAY_MS}ms...`);
        setTimeout(() => this.discoverAgentsWithRetry(retryCount + 1), this.RETRY_DELAY_MS);
      } else if (this.agents.size > 0) {
        this.logger.log(`Successfully discovered ${this.agents.size} agents!`);
      }
    } catch (error) {
      this.logger.error(`Error during agent discovery: ${error instanceof Error ? error.message : String(error)}`);
      
      // Retry if we haven't reached max retries
      if (retryCount < this.MAX_RETRIES) {
        this.logger.log(`Will retry discovery in ${this.RETRY_DELAY_MS}ms...`);
        setTimeout(() => this.discoverAgentsWithRetry(retryCount + 1), this.RETRY_DELAY_MS);
      } else {
        this.logger.error('Max retries reached, giving up on agent discovery');
      }
    }
  }
  
  /**
   * Discover agents from known endpoints
   */
  async discoverAgents(): Promise<void> {
    this.logger.log('Discovering A2A agents...');
    
    // First check if each agent is accessible before trying to get its card
    const accessibleEndpoints: string[] = [];
    
    for (const endpoint of this.agentUrls) {
      try {
        const isAccessible = await this.a2aClient.isAgentAccessible(endpoint);
        if (isAccessible) {
          accessibleEndpoints.push(endpoint);
          this.logger.log(`Agent at ${endpoint} is accessible`);
        } else {
          this.logger.warn(`Agent at ${endpoint} is not accessible`);
        }
      } catch (error) {
        this.logger.error(`Error checking accessibility of agent at ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Then register only the accessible agents
    for (const endpoint of accessibleEndpoints) {
      try {
        await this.registerAgentFromEndpoint(endpoint);
      } catch (error) {
        this.logger.error(`Error discovering agent at ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    this.logger.log(`Discovery complete, found ${this.agents.size} agents`);
  }
  
  /**
   * Register an agent by fetching its agent card
   * 
   * @param endpoint Base URL for the agent
   */
  async registerAgentFromEndpoint(endpoint: string): Promise<void> {
    try {
      const agentCard = await this.a2aClient.getAgentCard(endpoint);
      
      if (!this.isValidAgentCard(agentCard)) {
        this.logger.warn(`Invalid agent card received from ${endpoint}`);
        return;
      }
      
      this.logger.log(`Registering agent: ${agentCard.name}`);
      this.agents.set(agentCard.name, agentCard);
    } catch (error) {
      this.logger.error(`Failed to register agent from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Manually add an agent to the registry (for testing or direct configuration)
   * 
   * @param agentCard The agent card to add
   */
  addAgent(agentCard: AgentCard): void {
    if (!this.isValidAgentCard(agentCard)) {
      throw new Error('Invalid agent card');
    }
    
    this.logger.log(`Manually adding agent: ${agentCard.name}`);
    this.agents.set(agentCard.name, agentCard);
  }
  
  /**
   * Get all registered agents
   * 
   * @returns Array of agent cards
   */
  getAgents(): AgentCard[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get an agent by name
   * 
   * @param name Name of the agent to find
   * @returns Agent card or undefined if not found
   */
  getAgentByName(name: string): AgentCard | undefined {
    return this.agents.get(name);
  }
  
  /**
   * Find agents that have a skill matching the given skillName
   * 
   * @param skillName Name of the skill to search for
   * @returns Array of matching agent cards
   */
  findAgentsBySkill(skillName: string): AgentCard[] {
    return this.getAgents().filter(agent => 
      agent.skills.some(skill => 
        skill.name.toLowerCase().includes(skillName.toLowerCase())
      )
    );
  }
  
  /**
   * Find the most appropriate agent for a given query
   * This is a simple implementation that could be improved
   * with more sophisticated matching in the future
   * 
   * @param query The user's query
   * @returns The best matching agent or undefined if none found
   */
  findAgentForQuery(query: string): AgentCard | undefined {
    const queryLower = query.toLowerCase();
    
    // Vuex state management
    if (queryLower.includes('vuex') || 
        queryLower.includes('state management') || 
        queryLower.includes('store') ||
        (queryLower.includes('state') && (
          queryLower.includes('manage') || 
          queryLower.includes('management')
        ))) {
      return this.getAgentByName('Vuex A2A Agent');
    } 
    
    // Default to Vue Core for general Vue.js questions
    return this.getAgentByName('Vue Core A2A Agent');
  }
  
  /**
   * Validate that an agent card has all required fields
   * 
   * @param card Agent card to validate
   * @returns True if the card is valid
   */
  private isValidAgentCard(card: any): card is AgentCard {
    return (
      card &&
      typeof card.name === 'string' &&
      typeof card.url === 'string' &&
      typeof card.version === 'string' &&
      card.capabilities &&
      Array.isArray(card.skills) &&
      card.skills.length > 0
    );
  }
} 