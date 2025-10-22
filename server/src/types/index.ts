// Core types for WhatsApp instance management
export interface WhatsAppInstance {
  id: string;
  name: string;
  apiKey: string;
  serverUrl: string;
  status: InstanceStatus;
  qrCode?: string;
  connected: boolean;
  lastSeen?: Date;
  connectedAt?: Date;
  webhook?: string;
  evolutionInstanceName: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum InstanceStatus {
  PENDING = 'pending',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface QRCodeData {
  code: string;
  base64: string;
  instanceId: string;
  expiresAt: Date;
}

export interface WebhookEvent {
  event: string;
  instance: string;
  data: any;
  serverUrl: string;
  timestamp: Date;
}

export interface MessageData {
  instanceId: string;
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  filename?: string;
  caption?: string;
}

export interface InstanceCreateRequest {
  name: string;
  apiKey: string;
  serverUrl: string;
  webhookUrl?: string;
}

export interface InstanceUpdateRequest {
  name?: string;
  webhookUrl?: string;
}

export interface ConnectionStatus {
  instanceId: string;
  connected: boolean;
  lastSeen: Date;
  qrCode?: string;
  error?: string;
}

export interface EvolutionAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface InstanceListResponse {
  instances: WhatsAppInstance[];
  total: number;
  page: number;
  limit: number;
}