export interface WhatsAppInstance {
  id: string;
  name: string;
  evolutionInstanceName: string;
  status: InstanceStatus;
  connected: boolean;
  evolutionApiUrl: string;
  evolutionApiKey: string;
  webhook?: string;
  qrCode?: string;
  lastSeen?: string;
  connectedAt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type InstanceStatus = 
  | 'pending' 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error';

export interface CreateInstancePayload {
  name: string;
  webhook?: string;
}

export interface InstanceResponse {
  success: boolean;
  data: WhatsAppInstance;
  message?: string;
}

export interface InstanceListResponse {
  success: boolean;
  data: WhatsAppInstance[];
}

export interface QRCodeData {
  qrCode: string;
  instanceId: string;
}
