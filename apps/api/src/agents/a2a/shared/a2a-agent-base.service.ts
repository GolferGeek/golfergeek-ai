import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentCard, 
  TaskState, 
  Task, 
  TaskSendParams, 
  Message, 
  Part,
  TextPart,
  Artifact,
  JSONRPCError,
  ErrorCode
} from '../types/a2a.types';
import { TaskStoreService, TaskAndHistory } from './task-store.service';

/**
 * Base agent service to implement the core A2A protocol functionality
 * This class is meant to be extended by specific agent implementations
 */
@Injectable()
export abstract class A2AAgentBaseService {
  protected readonly logger = new Logger(this.constructor.name);
  
  constructor(protected taskStore: TaskStoreService) {}
  
  /**
   * Get the agent card with capabilities and metadata
   * Must be implemented by subclasses
   */
  abstract getAgentCard(): AgentCard;
  
  /**
   * Process a user message and generate a response
   * Must be implemented by subclasses
   * 
   * @param message The user message to process
   * @param taskId The ID of the task
   * @param sessionId Optional session ID for continuing conversations
   * @returns The agent's response message
   */
  abstract processMessage(
    message: Message,
    taskId: string,
    sessionId?: string | null
  ): Promise<Message>;
  
  /**
   * Handle a task send request as defined in the A2A protocol
   * 
   * @param params Task parameters from the request
   * @returns The created or updated task
   */
  async handleTaskSend(params: TaskSendParams): Promise<Task> {
    const { id: taskId, message, sessionId, metadata } = params;
    
    this.logger.log(`Handling task send for task ${taskId}`);
    
    try {
      // Get or create the task
      let taskData = await this.taskStore.createOrGetTask(
        taskId,
        message,
        sessionId,
        metadata
      );
      
      // Set task to working state
      const workingTaskData = await this.updateTaskStatusToWorking(taskId);
      
      if (!workingTaskData) {
        throw this.createError(
          ErrorCode.TaskNotFound,
          `Task ${taskId} not found`
        );
      }
      
      taskData = workingTaskData;
      
      // Process the message
      const responseMessage = await this.processMessage(
        message,
        taskId,
        sessionId
      );
      
      // Update task status to completed with the response message
      const completedTaskData = await this.taskStore.updateTaskStatus(
        taskId,
        TaskState.COMPLETED,
        responseMessage
      );
      
      if (!completedTaskData) {
        throw this.createError(
          ErrorCode.InternalError,
          `Failed to update task ${taskId}`
        );
      }
      
      return completedTaskData.task;
    } catch (error) {
      // If processing fails, update task to failed state
      await this.updateTaskStatusToFailed(taskId, error);
      throw error;
    }
  }
  
  /**
   * Handle a task get request as defined in the A2A protocol
   * 
   * @param taskId ID of the task to retrieve
   * @returns The task or null if not found
   */
  async handleTaskGet(taskId: string): Promise<Task | null> {
    this.logger.log(`Handling task get for task ${taskId}`);
    
    const taskData = await this.taskStore.getTask(taskId);
    
    if (!taskData) {
      this.logger.warn(`Task ${taskId} not found`);
      return null;
    }
    
    return taskData.task;
  }
  
  /**
   * Handle a task cancel request as defined in the A2A protocol
   * 
   * @param taskId ID of the task to cancel
   * @returns Object indicating if task was canceled
   */
  async handleTaskCancel(taskId: string): Promise<{ id: string; canceled: boolean }> {
    this.logger.log(`Handling task cancel for task ${taskId}`);
    
    const taskData = await this.taskStore.getTask(taskId);
    
    if (!taskData) {
      return { id: taskId, canceled: false };
    }
    
    // Check if task is already in a final state
    const finalStates = [
      TaskState.COMPLETED,
      TaskState.FAILED,
      TaskState.CANCELED
    ];
    
    if (finalStates.includes(taskData.task.status.state)) {
      return { id: taskId, canceled: false };
    }
    
    // Update task status to canceled
    const updatedTaskData = await this.taskStore.updateTaskStatus(
      taskId,
      TaskState.CANCELED
    );
    
    return { id: taskId, canceled: !!updatedTaskData };
  }
  
  /**
   * Add an artifact to a task
   * 
   * @param taskId Task ID
   * @param artifact The artifact to add
   */
  protected async addArtifact(taskId: string, artifact: Artifact): Promise<void> {
    await this.taskStore.addTaskArtifact(taskId, artifact);
  }
  
  /**
   * Create a text artifact
   * 
   * @param name Artifact name
   * @param text Text content
   * @returns Artifact object
   */
  protected createTextArtifact(name: string, text: string): Artifact {
    return {
      name,
      parts: [{ type: 'text', text }]
    };
  }
  
  /**
   * Update a task status to "working"
   * 
   * @param taskId Task ID
   * @returns Updated task data
   */
  protected async updateTaskStatusToWorking(taskId: string): Promise<TaskAndHistory | null> {
    const workingMessage: Message = {
      role: 'agent',
      parts: [this.createTextPart('Processing your request...')]
    };
    
    return this.taskStore.updateTaskStatus(
      taskId,
      TaskState.WORKING,
      workingMessage
    );
  }
  
  /**
   * Update a task status to "failed"
   * 
   * @param taskId Task ID
   * @param error The error that caused the failure
   * @returns Updated task data
   */
  protected async updateTaskStatusToFailed(
    taskId: string,
    error: unknown
  ): Promise<TaskAndHistory | null> {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);
    
    const failedMessage: Message = {
      role: 'agent',
      parts: [this.createTextPart(`Task failed: ${errorMessage}`)]
    };
    
    return this.taskStore.updateTaskStatus(
      taskId,
      TaskState.FAILED,
      failedMessage
    );
  }
  
  /**
   * Create a text part for messages
   * 
   * @param text The text content
   * @returns TextPart object
   */
  protected createTextPart(text: string): TextPart {
    return { type: 'text', text };
  }
  
  /**
   * Create an error object conforming to A2A protocol
   * 
   * @param code Error code
   * @param message Error message
   * @param data Optional additional data
   * @returns JSONRPCError object
   */
  protected createError(
    code: ErrorCode,
    message: string,
    data?: any
  ): JSONRPCError {
    return { code, message, data };
  }
} 