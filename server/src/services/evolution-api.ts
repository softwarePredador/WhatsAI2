import axios, { AxiosInstance } from 'axios';
import { WhatsAppInstance, InstanceStatus, QRCodeData } from '../types';
import { env } from '../config/env';

interface EvolutionApiConfig {
  baseURL: string;
  apiKey: string;
}

export class EvolutionApiService {
  private client: AxiosInstance;
  private config: EvolutionApiConfig;

  constructor(baseURL?: string, apiKey?: string) {
    this.config = {
      baseURL: baseURL || env.EVOLUTION_API_URL,
      apiKey: apiKey || env.EVOLUTION_API_KEY
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey
      },
      timeout: 30000
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        if (process.env['NODE_ENV'] === 'development') {
          console.log(`Evolution API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('Evolution API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        if (process.env['NODE_ENV'] === 'development') {
          console.log(`Evolution API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        console.error('Evolution API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async fetchInstances(): Promise<any[]> {
    try {
      const response = await this.client.get('/instance/fetchInstances');
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching instances from Evolution API:', error.response?.data || error.message);
      throw new Error('Failed to fetch instances from Evolution API');
    }
  }

  async createInstance(instanceData: Partial<WhatsAppInstance>): Promise<any> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName: instanceData.name,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS', // Add integration type
        webhook: instanceData.webhook || '',
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE'
        ]
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Evolution API instance:', error);
      throw error;
    }
  }

  async deleteInstance(instanceName: string): Promise<void> {
    try {
      await this.client.delete(`/instance/delete/${instanceName}`);
    } catch (error) {
      console.error('Error deleting Evolution API instance:', error);
      throw error;
    }
  }

  async connectInstance(instanceName: string): Promise<any> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('❌ [DEBUG EvolutionAPI] Error connecting instance:', error);
      throw error;
    }
  }

  async disconnectInstance(instanceName: string): Promise<void> {
    try {
      await this.client.delete(`/instance/logout/${instanceName}`);
    } catch (error) {
      console.error('Error disconnecting Evolution API instance:', error);
      throw error;
    }
  }

  async getInstanceStatus(instanceName: string): Promise<InstanceStatus> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      const state = response.data?.instance?.state;
      
      switch (state) {
        case 'open':
          return InstanceStatus.CONNECTED;
        case 'connecting':
          return InstanceStatus.CONNECTING;
        case 'close':
          return InstanceStatus.DISCONNECTED;
        default:
          return InstanceStatus.PENDING;
      }
    } catch (error) {
      console.error('Error getting Evolution API instance status:', error);
      return InstanceStatus.DISCONNECTED;
    }
  }

  async getQRCode(instanceName: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/instance/qrcode/${instanceName}`);
      const { data } = response;

      if (data && (data.code || data.base64)) {
        return data.code || data.base64;
      }

      return null;
    } catch (error) {
      console.error('❌ [DEBUG EvolutionAPI getQRCode] Error:', error);
      return null;
    }
  }

  async sendTextMessage(instanceName: string, number: string, text: string): Promise<any> {
    try {
      // Formato correto baseado na documentação Evolution API v2
      const payload = {
        number: number,
        text: text,
        delay: 1200,
        linkPreview: false
      };
      
      const response = await this.client.post(`/message/sendText/${instanceName}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  }

  async sendMediaMessage(instanceName: string, number: string, mediaUrl: string, caption?: string): Promise<any> {
    try {
      const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
        number: number,
        options: {
          delay: 1200,
          presence: 'composing'
        },
        mediaMessage: {
          mediatype: 'image', // Can be 'image', 'video', 'audio', 'document'
          media: mediaUrl,
          caption: caption
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending media message:', error);
      throw error;
    }
  }

  async getInstanceInfo(instanceName: string): Promise<any> {
    try {
      const response = await this.client.get(`/instance/fetchInstances`);
      const instances = response.data;
      
      return instances.find((instance: any) => instance.instance.instanceName === instanceName);
    } catch (error) {
      console.error('Error getting instance info:', error);
      throw error;
    }
  }

  async webhookExists(instanceName: string): Promise<boolean> {
    try {
      const instanceInfo = await this.getInstanceInfo(instanceName);
      return !!instanceInfo?.webhook;
    } catch (error) {
      console.error('Error checking webhook:', error);
      return false;
    }
  }
}