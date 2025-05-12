/**
 * A2A Protocol Types
 * Follows Google A2A protocol specification
 */

// Base JSON-RPC Types
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: Record<string, any>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string;
  result?: any;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

// Agent Metadata Types
export interface AgentCard {
  name: string;
  description?: string | null;
  url: string;
  provider?: AgentProvider | null;
  version: string;
  documentationUrl?: string | null;
  capabilities: AgentCapabilities;
  authentication?: AgentAuthentication | null;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills: AgentSkill[];
}

export interface AgentProvider {
  organization: string;
  url?: string | null;
}

export interface AgentCapabilities {
  streaming: boolean;
  pushNotifications: boolean;
  stateTransitionHistory: boolean;
}

export interface AgentAuthentication {
  required: boolean;
  type?: string | null;
  instructions?: string | null;
}

export interface AgentSkill {
  name: string;
  description?: string | null;
  inputModes?: string[];
  outputModes?: string[];
}

// Task Types
export enum TaskState {
  UNKNOWN = 'unknown',
  SUBMITTED = 'submitted',
  WORKING = 'working',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
  INPUT_REQUIRED = 'input_required'
}

export interface Task {
  id: string;
  sessionId?: string | null;
  status: TaskStatus;
  history?: Message[];
  artifacts?: Artifact[];
  metadata?: Record<string, any> | null;
}

export interface TaskStatus {
  state: TaskState;
  message?: Message | null;
  timestamp: string; // ISO 8601 timestamp
}

// Message Types
export interface Message {
  role: 'user' | 'agent' | 'system';
  parts: Part[];
  metadata?: Record<string, any> | null;
}

export type Part = TextPart | FilePart | DataPart;

export interface TextPart {
  type: 'text';
  text: string;
  metadata?: Record<string, any> | null;
}

export interface FilePart {
  type: 'file';
  file: FileContent;
  metadata?: Record<string, any> | null;
}

export interface DataPart {
  type: 'data';
  data: Record<string, any>;
  metadata?: Record<string, any> | null;
}

export interface FileContent {
  name?: string | null;
  mimeType?: string | null;
  bytes?: string | null; // Base64 encoded content
  uri?: string | null;
}

// Artifact Types
export interface Artifact {
  name?: string | null;
  description?: string | null;
  parts: Part[];
  index?: number;
  append?: boolean | null;
  lastChunk?: boolean | null;
  metadata?: Record<string, any> | null;
}

// Task Request/Response Types
export interface TaskIdParams {
  id: string;
}

export interface TaskSendParams {
  id: string;
  sessionId?: string | null;
  message: Message;
  acceptedOutputModes?: string[];
  pushNotification?: PushNotificationConfig | null;
  metadata?: Record<string, any> | null;
}

export interface SendTaskRequest extends JSONRPCRequest {
  method: 'tasks/send';
  params: TaskSendParams;
}

export interface SendTaskResponse extends JSONRPCResponse {
  result: Task | null;
}

export interface SendTaskStreamingRequest extends JSONRPCRequest {
  method: 'tasks/sendSubscribe';
  params: TaskSendParams;
}

export interface GetTaskRequest extends JSONRPCRequest {
  method: 'tasks/get';
  params: TaskIdParams;
}

export interface GetTaskResponse extends JSONRPCResponse {
  result: Task | null;
}

export interface CancelTaskRequest extends JSONRPCRequest {
  method: 'tasks/cancel';
  params: TaskIdParams;
}

export interface CancelTaskResponse extends JSONRPCResponse {
  result: {
    id: string;
    canceled: boolean;
  } | null;
}

// Push Notification Types
export interface PushNotificationConfig {
  url: string;
  token?: string | null;
  authentication?: Record<string, any> | null;
}

export interface TaskPushNotificationConfig {
  taskId: string;
  config: PushNotificationConfig;
}

// Event Types
export interface TaskStatusUpdateEvent {
  type: 'status_update';
  task: Task;
  final: boolean;
}

export interface TaskArtifactUpdateEvent {
  type: 'artifact_update';
  taskId: string;
  artifact: Artifact;
  final: boolean;
}

// Custom Error Codes
export enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  TaskNotFound = 404,
  TaskCanceled = 499
} 