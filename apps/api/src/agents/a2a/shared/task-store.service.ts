import { Injectable, Logger } from '@nestjs/common';
import { Task, Message, Artifact, TaskState } from '../types/a2a.types';

/**
 * Interface for storing and retrieving task information
 */
export interface TaskAndHistory {
  task: Task;
  history: Message[];
}

/**
 * In-memory implementation of task storage for A2A agents
 * For production, this should be replaced with a persistent storage solution
 */
@Injectable()
export class TaskStoreService {
  private readonly logger = new Logger(TaskStoreService.name);
  private tasks: Map<string, TaskAndHistory> = new Map();
  
  /**
   * Create a new task or retrieve an existing one
   * 
   * @param taskId Unique identifier for the task
   * @param message Initial message for the task
   * @param sessionId Optional session identifier
   * @param metadata Optional task metadata
   * @returns The task and its history
   */
  async createOrGetTask(
    taskId: string,
    message?: Message,
    sessionId?: string | null,
    metadata?: Record<string, any> | null
  ): Promise<TaskAndHistory> {
    // Check if task already exists
    if (this.tasks.has(taskId)) {
      return this.tasks.get(taskId)!;
    }
    
    // Create new task
    const now = new Date().toISOString();
    const history = message ? [message] : [];
    
    const task: Task = {
      id: taskId,
      sessionId: sessionId || null,
      status: {
        state: TaskState.SUBMITTED,
        timestamp: now,
        message: message || null
      },
      history: history,
      artifacts: [],
      metadata: metadata || null
    };
    
    const taskData: TaskAndHistory = {
      task,
      history
    };
    
    // Store the task
    this.tasks.set(taskId, taskData);
    this.logger.log(`Created new task: ${taskId}`);
    
    return taskData;
  }
  
  /**
   * Get a task by ID
   * 
   * @param taskId The task ID to retrieve
   * @returns The task and its history, or null if not found
   */
  async getTask(taskId: string): Promise<TaskAndHistory | null> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      this.logger.warn(`Task not found: ${taskId}`);
      return null;
    }
    
    return task;
  }
  
  /**
   * Update a task's status
   * 
   * @param taskId The task ID to update
   * @param state New task state
   * @param message Optional message to include with the update
   * @returns The updated task and history, or null if task not found
   */
  async updateTaskStatus(
    taskId: string,
    state: TaskState,
    message?: Message
  ): Promise<TaskAndHistory | null> {
    const taskData = await this.getTask(taskId);
    
    if (!taskData) {
      return null;
    }
    
    // Create a copy of the task to avoid direct mutation
    const task = { ...taskData.task };
    const history = [...taskData.history];
    
    // Update the status
    task.status = {
      state,
      timestamp: new Date().toISOString(),
      message: message || task.status.message
    };
    
    // If there's a new message, add it to history
    if (message) {
      history.push(message);
      task.history = history;
    }
    
    // Save the updated task
    const updatedTaskData = { task, history };
    this.tasks.set(taskId, updatedTaskData);
    
    this.logger.log(`Updated task ${taskId} to state: ${state}`);
    
    return updatedTaskData;
  }
  
  /**
   * Add an artifact to a task
   * 
   * @param taskId The task ID to update
   * @param artifact The artifact to add
   * @returns The updated task and history, or null if task not found
   */
  async addTaskArtifact(
    taskId: string,
    artifact: Artifact
  ): Promise<TaskAndHistory | null> {
    const taskData = await this.getTask(taskId);
    
    if (!taskData) {
      return null;
    }
    
    // Create a copy of the task to avoid direct mutation
    const task = { ...taskData.task };
    
    // Initialize artifacts array if it doesn't exist
    if (!task.artifacts) {
      task.artifacts = [];
    }
    
    // Add the artifact
    task.artifacts.push(artifact);
    
    // Save the updated task
    const updatedTaskData = { ...taskData, task };
    this.tasks.set(taskId, updatedTaskData);
    
    this.logger.log(`Added artifact to task ${taskId}: ${artifact.name || 'unnamed'}`);
    
    return updatedTaskData;
  }
  
  /**
   * Delete a task
   * 
   * @param taskId The task ID to delete
   * @returns True if the task was deleted, false if it wasn't found
   */
  async deleteTask(taskId: string): Promise<boolean> {
    if (!this.tasks.has(taskId)) {
      return false;
    }
    
    this.tasks.delete(taskId);
    this.logger.log(`Deleted task: ${taskId}`);
    
    return true;
  }
  
  /**
   * List all task IDs
   * 
   * @returns Array of task IDs
   */
  async listTaskIds(): Promise<string[]> {
    return Array.from(this.tasks.keys());
  }
} 