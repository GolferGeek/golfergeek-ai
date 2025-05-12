import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentCard,
  JSONRPCRequest,
  JSONRPCResponse,
  Task,
  TaskSendParams,
  Message,
  TaskIdParams
} from '../types/a2a.types';

/**
 * A client for communicating with A2A agents
 * Implements the A2A protocol for JSON-RPC requests
 */
@Injectable()
export class A2AClientService {
  private readonly logger = new Logger(A2AClientService.name);
  
  // Default timeout for HTTP requests (in milliseconds)
  private readonly DEFAULT_TIMEOUT = 10000;
  
  /**
   * Send a task to an A2A agent
   * 
   * @param agentCard The agent card to send the task to
   * @param message User message to send
   * @param sessionId Optional session ID
   * @returns The created task
   */
  async sendTask(
    agentCard: AgentCard,
    message: Message,
    sessionId?: string | null
  ): Promise<Task> {
    this.logger.log(`Sending task to agent: ${agentCard.name} (${agentCard.url})`);
    
    const taskId = uuidv4();
    
    const params: TaskSendParams = {
      id: taskId,
      sessionId: sessionId || null,
      message
    };
    
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: uuidv4(),
      method: 'tasks/send',
      params
    };
    
    try {
      const response = await this.sendJsonRpcRequest(agentCard.url, request);
      
      if (!response.result) {
        if (response.error) {
          throw new Error(`Agent ${agentCard.name} returned error: ${response.error.message} (code: ${response.error.code})`);
        }
        throw new Error(`Agent ${agentCard.name} returned empty result`);
      }
      
      return response.result as Task;
    } catch (error) {
      this.logger.error(`Error sending task to agent ${agentCard.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get a task from an A2A agent
   * 
   * @param agentCard The agent card
   * @param taskId ID of the task to get
   * @returns The task or null if not found
   */
  async getTask(agentCard: AgentCard, taskId: string): Promise<Task | null> {
    this.logger.log(`Getting task ${taskId} from agent: ${agentCard.name} (${agentCard.url})`);
    
    const params: TaskIdParams = { id: taskId };
    
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: uuidv4(),
      method: 'tasks/get',
      params
    };
    
    try {
      const response = await this.sendJsonRpcRequest(agentCard.url, request);
      
      if (response.error) {
        if (response.error.code === 404) {
          return null; // Task not found
        }
        throw new Error(`Agent ${agentCard.name} returned error: ${response.error.message}`);
      }
      
      return response.result as Task;
    } catch (error) {
      this.logger.error(`Error getting task from agent ${agentCard.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Cancel a task on an A2A agent
   * 
   * @param agentCard The agent card
   * @param taskId ID of the task to cancel
   * @returns Result indicating if the task was canceled
   */
  async cancelTask(
    agentCard: AgentCard,
    taskId: string
  ): Promise<{ id: string; canceled: boolean }> {
    this.logger.log(`Canceling task ${taskId} on agent: ${agentCard.name} (${agentCard.url})`);
    
    const params: TaskIdParams = { id: taskId };
    
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: uuidv4(),
      method: 'tasks/cancel',
      params
    };
    
    try {
      const response = await this.sendJsonRpcRequest(agentCard.url, request);
      
      if (response.error) {
        throw new Error(`Agent ${agentCard.name} returned error: ${response.error.message}`);
      }
      
      return response.result as { id: string; canceled: boolean };
    } catch (error) {
      this.logger.error(`Error canceling task on agent ${agentCard.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get the agent card from an agent
   * 
   * @param agentUrl Base URL of the agent
   * @returns Agent card
   */
  async getAgentCard(agentUrl: string): Promise<AgentCard> {
    const agentCardUrl = `${agentUrl}/.well-known/agent.json`;
    this.logger.log(`Fetching agent card from: ${agentCardUrl}`);
    
    try {
      const response = await axios.get<AgentCard>(agentCardUrl, {
        timeout: this.DEFAULT_TIMEOUT,
        validateStatus: status => status === 200  // Only accept 200 OK responses
      });
      
      this.logger.log(`Successfully retrieved agent card: ${response.data.name}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          this.logger.error(`Connection refused while fetching agent card from ${agentCardUrl}`);
        } else if (error.code === 'ETIMEDOUT') {
          this.logger.error(`Connection timed out while fetching agent card from ${agentCardUrl}`);
        } else if (error.response) {
          this.logger.error(`HTTP error ${error.response.status} while fetching agent card from ${agentCardUrl}: ${error.response.statusText}`);
        } else if (error.request) {
          this.logger.error(`No response received while fetching agent card from ${agentCardUrl}`);
        } else {
          this.logger.error(`Error fetching agent card from ${agentCardUrl}: ${error.message}`);
        }
      } else {
        this.logger.error(`Unknown error fetching agent card from ${agentCardUrl}: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }
  
  /**
   * Check if an agent endpoint is accessible
   * 
   * @param agentUrl Base URL of the agent
   * @returns True if the agent is accessible
   */
  async isAgentAccessible(agentUrl: string): Promise<boolean> {
    try {
      await this.getAgentCard(agentUrl);
      return true;
    } catch (error) {
      this.logger.warn(`Agent at ${agentUrl} is not accessible: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Send a JSON-RPC request to an agent
   * 
   * @param agentUrl URL of the agent endpoint
   * @param request JSON-RPC request to send
   * @returns JSON-RPC response
   */
  private async sendJsonRpcRequest(
    agentUrl: string,
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse> {
    this.logger.verbose(`Sending JSON-RPC request to ${agentUrl}: ${request.method}`);
    
    try {
      const response = await axios.post<JSONRPCResponse>(agentUrl, request, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: this.DEFAULT_TIMEOUT
      });
      
      this.logger.verbose(`Received JSON-RPC response from ${agentUrl}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          this.logger.error(`Connection refused when sending JSON-RPC request to ${agentUrl}`);
        } else if (error.code === 'ETIMEDOUT') {
          this.logger.error(`Request timed out when sending JSON-RPC request to ${agentUrl}`);
        } else if (error.response) {
          this.logger.error(`HTTP error ${error.response.status} from ${agentUrl}: ${error.response.statusText}`);
          
          // Try to parse error response as JSON-RPC
          const errorResponse = error.response.data as JSONRPCResponse;
          if (errorResponse && errorResponse.error) {
            return errorResponse;
          }
        } else if (error.request) {
          this.logger.error(`No response received from ${agentUrl} for JSON-RPC request`);
        }
      }
      
      // If no proper JSON-RPC error response, create one
      const errorResponse: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603, // Internal error
          message: error instanceof Error ? error.message : String(error)
        }
      };
      
      return errorResponse;
    }
  }
} 