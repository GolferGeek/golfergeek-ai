import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { A2AAgentBaseService } from '../shared/a2a-agent-base.service';
import { TaskStoreService } from '../shared/task-store.service';
import { AgentRegistryService } from './agent-registry.service';
import { A2AClientService } from './a2a-client.service';
import { 
  AgentCard, 
  Message, 
  TextPart, 
  Task
} from '../types/a2a.types';
import { OpenAIService } from '../../../services/openai.service';

/**
 * Orchestrator agent service
 * Implements A2A protocol and delegates tasks to specialized agents
 */
@Injectable()
export class OrchestratorService extends A2AAgentBaseService implements OnModuleInit {
  constructor(
    protected taskStore: TaskStoreService,
    private agentRegistry: AgentRegistryService,
    private a2aClient: A2AClientService,
    private openaiService: OpenAIService
  ) {
    super(taskStore);
  }
  
  /**
   * Initialize with some default agents if discovery fails
   */
  async onModuleInit() {
    // Wait a bit to ensure all controllers are registered
    setTimeout(async () => {
      const agents = this.agentRegistry.getAgents();
      
      // If no agents were discovered, register them manually
      if (agents.length === 0) {
        await this.manuallyRegisterAgents();
      }
    }, 5000); // Wait 5 seconds for all controllers to be ready
  }
  
  /**
   * Manually register agents for testing purposes
   */
  async manuallyRegisterAgents(): Promise<void> {
    this.logger.log('Manually registering agents...');
    
    // Register Vue Core agent with enhanced description
    this.agentRegistry.addAgent({
      name: 'Vue Core A2A Agent',
      description: 'Specialized agent for Vue.js core framework concepts, components, templates, directives, lifecycle hooks, and reactivity. Can answer questions about Vue instance, component composition, props, slots, events, custom directives, and Vue template syntax.',
      url: 'http://localhost:3333/api/agents/a2a/vue-core',
      version: '1.0.0',
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: true
      },
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      skills: [
        {
          name: 'vue_core_knowledge',
          description: 'In-depth knowledge about Vue.js components, templates, directives, and core concepts'
        },
        {
          name: 'vue_template_syntax',
          description: 'Expertise in Vue template syntax, interpolation, directives, and rendering'
        },
        {
          name: 'vue_component_lifecycle',
          description: 'Understanding of Vue component lifecycle hooks and their usage patterns'
        }
      ]
    });
    
    // Register Vuex agent with enhanced description
    this.agentRegistry.addAgent({
      name: 'Vuex A2A Agent',
      description: 'Specialized agent for Vuex state management in Vue.js applications. Provides expertise on stores, state, getters, mutations, actions, modules, and plugins. Can answer questions about state management patterns, data flow, and integrating Vuex with Vue components.',
      url: 'http://localhost:3333/api/agents/a2a/vuex',
      version: '1.0.0',
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: true
      },
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      skills: [
        {
          name: 'vuex_knowledge',
          description: 'Comprehensive knowledge about Vuex state management architecture and patterns'
        },
        {
          name: 'vuex_store_management',
          description: 'Expertise in Vuex store configuration, modules, and plugins'
        },
        {
          name: 'vuex_data_flow',
          description: 'Understanding of Vuex state mutations, actions, getters, and one-way data flow'
        }
      ]
    });
    
    this.logger.log(`Manually registered ${this.agentRegistry.getAgents().length} agents`);
  }
  
  /**
   * Get the agent card for the orchestrator
   * @returns Agent card with metadata and capabilities
   */
  getAgentCard(): AgentCard {
    return {
      name: 'Vue.js Orchestrator Agent',
      description: 'A2A orchestrator agent that coordinates specialized Vue.js agents',
      url: 'http://localhost:3333/api/agents/a2a/orchestrator',
      version: '1.0.0',
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: true
      },
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      skills: [
        {
          name: 'vue_knowledge_orchestration',
          description: 'Coordinates specialized Vue.js agents to answer questions about Vue.js ecosystem',
          inputModes: ['text'],
          outputModes: ['text']
        }
      ]
    };
  }
  
  /**
   * List all available agents
   * @returns Array of agent cards
   */
  getAvailableAgents(): AgentCard[] {
    return this.agentRegistry.getAgents();
  }
  
  /**
   * Find the best agent for a query with LLM-based routing
   * 
   * @param query The user query
   * @returns The best matching agent or undefined if none found
   */
  private async findBestAgentForQuery(query: string): Promise<AgentCard | undefined> {
    try {
      // Get all available agents
      const agents = this.getAvailableAgents();
      
      if (agents.length === 0) {
        return undefined;
      }
      
      if (agents.length === 1) {
        return agents[0];
      }
      
      // Use the OpenAI service to determine the best agent
      const selectedAgentName = await this.openaiService.selectAgentForQuery(
        query,
        agents.map(agent => ({
          name: agent.name,
          description: agent.description || '',
          skills: agent.skills.map(skill => ({
            name: skill.name,
            description: skill.description || ''
          }))
        }))
      );
      
      // Find the agent with the selected name
      if (selectedAgentName) {
        this.logger.log(`LLM selected agent: ${selectedAgentName}`);
        return this.agentRegistry.getAgentByName(selectedAgentName);
      }
      
      // Fallback to the registry's built-in query matching if LLM fails
      this.logger.warn('LLM agent selection failed, falling back to keyword matching');
      return this.agentRegistry.findAgentForQuery(query);
    } catch (error) {
      this.logger.error(`Error in LLM agent selection: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to the original keyword matching implementation
      this.logger.warn('Falling back to keyword matching due to LLM error');
      
      // Check for Vuex-related terms first (more specific)
      const queryLower = query.toLowerCase();
      if (queryLower.includes('vuex') || 
          queryLower.includes('getter') || 
          queryLower.includes('mutation') ||
          queryLower.includes('action') ||
          queryLower.includes('commit') ||
          queryLower.includes('dispatch') ||
          // Add more specific state management terms
          (queryLower.includes('state') && queryLower.includes('management')) ||
          (queryLower.includes('state') && queryLower.includes('store'))) {
        return this.agentRegistry.getAgentByName('Vuex A2A Agent');
      }
      
      // Try keyword matching with components, props, directives, etc.
      if (queryLower.includes('component') || 
          queryLower.includes('props') || 
          queryLower.includes('directive') ||
          queryLower.includes('lifecycle') ||
          queryLower.includes('template')) {
        return this.agentRegistry.getAgentByName('Vue Core A2A Agent');
      }
      
      // Default to the first available agent if we still can't decide
      const agents = this.getAvailableAgents();
      return agents.length > 0 ? agents[0] : undefined;
    }
  }
  
  /**
   * Process a message by selecting the appropriate agent and delegating the task
   * 
   * @param message User message to process
   * @param taskId ID of the orchestrator task
   * @param sessionId Optional session ID for continuing conversations
   * @returns Response message with delegated agent's response
   */
  async processMessage(
    message: Message,
    taskId: string,
    sessionId?: string | null
  ): Promise<Message> {
    this.logger.log(`Orchestrator processing message for task ${taskId}`);
    
    // Extract text content from message parts
    const query = this.extractTextFromMessage(message);
    
    if (!query) {
      return this.createErrorMessage('No text content found in the message');
    }
    
    try {
      // Special command to list available agents
      if (query.toLowerCase().includes('list agents')) {
        return this.createAgentListResponse();
      }
      
      // Special command to trigger re-discovery of agents
      if (query.toLowerCase().includes('discover agents')) {
        await this.agentRegistry.discoverAgentsWithRetry();
        return this.createResponseMessage('Agent discovery initiated. Please try your query again in a few seconds.');
      }
      
      // Check if we have any agents registered
      const availableAgents = this.getAvailableAgents();
      if (availableAgents.length === 0) {
        // If no agents, trigger discovery
        this.logger.log('No agents available, initiating discovery');
        await this.agentRegistry.discoverAgentsWithRetry();
        return this.createResponseMessage(
          'No agents are currently available. I\'ve initiated agent discovery. Please try again in a few seconds, or type "list agents" to see if any agents have been discovered.'
        );
      }
      
      // Find the most appropriate agent for this query - now uses LLM
      const targetAgent = await this.findBestAgentForQuery(query);
      
      if (!targetAgent) {
        return this.createErrorMessage('No suitable agent found for this query. Try asking about Vue.js core concepts or Vuex state management.');
      }
      
      // Add a working message with the selected agent
      await this.addAgentSelectionArtifact(taskId, targetAgent);
      
      // Delegate the task to the selected agent
      const delegatedTask = await this.delegateTask(targetAgent, message, sessionId);
      
      // Create a response with the delegated agent's response
      return this.createDelegatedResponse(targetAgent, delegatedTask);
    } catch (error) {
      this.logger.error(`Error in orchestrator: ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorMessage(`Error processing your request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delegate a task to a specialized agent
   * 
   * @param agent Agent to delegate to
   * @param message Original user message
   * @param sessionId Optional session ID
   * @returns The task created on the delegated agent
   */
  private async delegateTask(
    agent: AgentCard,
    message: Message,
    sessionId?: string | null
  ): Promise<Task> {
    this.logger.log(`Delegating task to ${agent.name}`);
    
    try {
      return await this.a2aClient.sendTask(agent, message, sessionId);
    } catch (error) {
      this.logger.error(`Error delegating to ${agent.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a response with the agent list
   * @returns Message with agent list
   */
  private createAgentListResponse(): Message {
    const agents = this.getAvailableAgents();
    
    if (agents.length === 0) {
      return this.createResponseMessage('No agents are currently available. Try typing "discover agents" to initiate agent discovery.');
    }
    
    let response = 'Available agents:\n\n';
    
    agents.forEach(agent => {
      response += `📋 ${agent.name}\n`;
      response += `   Description: ${agent.description || 'No description'}\n`;
      response += `   Skills: ${agent.skills.map(s => s.name).join(', ')}\n\n`;
    });
    
    return this.createResponseMessage(response);
  }
  
  /**
   * Create a response from the delegated agent's task
   * 
   * @param agent The agent that was delegated to
   * @param task The task from the delegated agent
   * @returns Message with the delegated response
   */
  private createDelegatedResponse(agent: AgentCard, task: Task): Message {
    // Extract the agent's response message, preferably from the task status
    const agentMessage = task.status.message || 
      (task.history && task.history.length > 0 ? task.history[task.history.length - 1] : null);
    
    if (!agentMessage) {
      return this.createErrorMessage(`No response received from ${agent.name}`);
    }
    
    // Get text content from the agent's message
    let agentResponse = '';
    for (const part of agentMessage.parts) {
      if (part.type === 'text') {
        agentResponse += part.text + ' ';
      }
    }
    
    if (!agentResponse) {
      return this.createErrorMessage(`Empty response received from ${agent.name}`);
    }
    
    // Create orchestrator's response including the agent attribution
    return this.createResponseMessage(
      `${agent.name} responds:\n\n${agentResponse.trim()}`
    );
  }
  
  /**
   * Add an artifact indicating which agent was selected
   * 
   * @param taskId ID of the orchestrator task
   * @param agent The selected agent
   */
  private async addAgentSelectionArtifact(taskId: string, agent: AgentCard): Promise<void> {
    const artifact = this.createTextArtifact(
      'agent_selection',
      `Selected agent: ${agent.name} (${agent.description || 'No description'})`
    );
    
    await this.addArtifact(taskId, artifact);
  }
  
  /**
   * Extract text content from a message
   * 
   * @param message Message to extract text from
   * @returns Combined text content or empty string
   */
  private extractTextFromMessage(message: Message): string {
    let textContent = '';
    
    for (const part of message.parts) {
      if (part.type === 'text') {
        textContent += part.text + ' ';
      }
    }
    
    return textContent.trim();
  }
  
  /**
   * Create a response message with text content
   * 
   * @param text Text content for the response
   * @returns Message object
   */
  private createResponseMessage(text: string): Message {
    return {
      role: 'agent',
      parts: [{ type: 'text', text }]
    };
  }
  
  /**
   * Create an error message
   * 
   * @param errorText Error text
   * @returns Message object
   */
  private createErrorMessage(errorText: string): Message {
    return this.createResponseMessage(`Error: ${errorText}`);
  }
} 