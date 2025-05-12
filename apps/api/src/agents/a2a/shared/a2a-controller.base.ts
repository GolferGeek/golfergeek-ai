import { Controller, Get, Post, Body, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { 
  JSONRPCRequest, 
  JSONRPCResponse, 
  JSONRPCError, 
  AgentCard,
  TaskSendParams,
  TaskIdParams,
  ErrorCode
} from '../types/a2a.types';
import { A2AAgentBaseService } from './a2a-agent-base.service';

/**
 * Base controller for A2A protocol compliant agents
 * Implements the required endpoints for the protocol
 */
export abstract class A2AControllerBase {
  protected readonly logger = new Logger(this.constructor.name);
  
  /**
   * Get the agent service that implements A2A functionality
   */
  abstract getAgentService(): A2AAgentBaseService;
  
  /**
   * Get the agent card
   * This is a standard endpoint defined by the A2A protocol
   * Always available at /.well-known/agent.json
   */
  @Get('.well-known/agent.json')
  getAgentCard(): AgentCard {
    this.logger.log('Serving agent card');
    return this.getAgentService().getAgentCard();
  }
  
  /**
   * Process JSON-RPC requests for the A2A protocol
   * This is the main endpoint for A2A communication
   */
  @Post()
  async processJsonRpcRequest(@Body() request: any): Promise<JSONRPCResponse> {
    if (!this.isValidJsonRpcRequest(request)) {
      return this.createErrorResponse(
        ErrorCode.InvalidRequest,
        'Invalid JSON-RPC request',
        typeof request?.id === 'string' ? request.id : '0'
      );
    }
    
    this.logger.log(`Processing JSON-RPC request: ${request.method}`);
    
    try {
      switch (request.method) {
        case 'tasks/send':
          return await this.handleTaskSend(request);
        
        case 'tasks/get':
          return await this.handleTaskGet(request);
        
        case 'tasks/cancel':
          return await this.handleTaskCancel(request);
        
        default:
          return this.createErrorResponse(
            ErrorCode.MethodNotFound,
            `Method not supported: ${request.method}`,
            request.id
          );
      }
    } catch (error) {
      this.logger.error(`Error processing JSON-RPC request: ${error}`);
      
      if (error instanceof HttpException) {
        return this.createErrorResponse(
          ErrorCode.InternalError,
          error.message,
          request.id
        );
      }
      
      return this.createErrorResponse(
        ErrorCode.InternalError,
        error instanceof Error ? error.message : String(error),
        request.id
      );
    }
  }
  
  /**
   * Handle a task send request
   */
  private async handleTaskSend(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const params = request.params as TaskSendParams;
    
    if (!this.isValidTaskSendParams(params)) {
      return this.createErrorResponse(
        ErrorCode.InvalidParams,
        'Invalid task send parameters',
        request.id
      );
    }
    
    const task = await this.getAgentService().handleTaskSend(params);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: task
    };
  }
  
  /**
   * Handle a task get request
   */
  private async handleTaskGet(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const params = request.params as TaskIdParams;
    
    if (!params?.id) {
      return this.createErrorResponse(
        ErrorCode.InvalidParams,
        'Missing task ID',
        request.id
      );
    }
    
    const task = await this.getAgentService().handleTaskGet(params.id);
    
    if (!task) {
      return this.createErrorResponse(
        ErrorCode.TaskNotFound,
        `Task not found: ${params.id}`,
        request.id
      );
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: task
    };
  }
  
  /**
   * Handle a task cancel request
   */
  private async handleTaskCancel(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const params = request.params as TaskIdParams;
    
    if (!params?.id) {
      return this.createErrorResponse(
        ErrorCode.InvalidParams,
        'Missing task ID',
        request.id
      );
    }
    
    const result = await this.getAgentService().handleTaskCancel(params.id);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result
    };
  }
  
  /**
   * Validate if a request is a proper JSON-RPC request
   */
  private isValidJsonRpcRequest(request: any): request is JSONRPCRequest {
    return (
      request &&
      request.jsonrpc === '2.0' &&
      typeof request.method === 'string' &&
      request.id
    );
  }
  
  /**
   * Validate if task send parameters are valid
   */
  private isValidTaskSendParams(params: any): params is TaskSendParams {
    return (
      params &&
      typeof params.id === 'string' &&
      params.message &&
      typeof params.message.role === 'string' &&
      Array.isArray(params.message.parts) &&
      params.message.parts.length > 0
    );
  }
  
  /**
   * Create a JSON-RPC error response
   */
  private createErrorResponse(
    code: ErrorCode,
    message: string,
    id: string,
    data?: any
  ): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }
} 