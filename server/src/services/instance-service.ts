import { WhatsAppInstance, InstanceStatus } from '../types';
import { EvolutionApiService } from './evolution-api';
import { SocketService } from './socket-service';
import { ConversationService } from './conversation-service';
import { PrismaInstanceRepository } from '../database/repositories/instance-repository';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

interface CreateInstanceData {
  name: string;
  userId: string;
  webhook?: string;
  token?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
}

export class WhatsAppInstanceService {
  private evolutionApi: EvolutionApiService;
  private socketService: SocketService;
  private conversationService: ConversationService;
  private repository: PrismaInstanceRepository;
  private instances: Map<string, WhatsAppInstance> = new Map();

  constructor() {
    this.evolutionApi = new EvolutionApiService();
    this.socketService = SocketService.getInstance();
    this.conversationService = new ConversationService();
    this.repository = new PrismaInstanceRepository();
    
    // Load existing instances from database on startup
    this.loadInstancesFromDatabase();
  }

  private async loadInstancesFromDatabase(): Promise<void> {
    try {
      const instances = await this.repository.findAll();
      instances.forEach(instance => {
        this.instances.set(instance.id, instance);
      });
      console.log(`📱 Loaded ${instances.length} instances from database`);
    } catch (error) {
      console.error('Error loading instances from database:', error);
      // Continue without database if it's not available
    }
  }

  async createInstance(data: CreateInstanceData): Promise<WhatsAppInstance> {
    try {
      const instanceId = uuidv4();
      const evolutionInstanceName = `whatsai_${instanceId.replace(/-/g, '_')}`;

      // Determine which Evolution API server to use
      const evolutionApiUrl = data.evolutionApiUrl || this.getAvailableEvolutionServer();
      const evolutionApiKey = data.evolutionApiKey || this.getEvolutionApiKey(evolutionApiUrl);

      // Create instance in Evolution API
      const evolutionApi = new EvolutionApiService(evolutionApiUrl, evolutionApiKey);
      const evolutionResponse = await evolutionApi.createInstance({
        name: evolutionInstanceName,
        ...(data.webhook && { webhook: data.webhook })
      });

      // Save to database
      const instance = await this.repository.create({
        name: data.name,
        userId: data.userId,
        evolutionInstanceName,
        evolutionApiUrl,
        evolutionApiKey,
        ...(data.webhook && { webhook: data.webhook })
      });

      // Keep in memory cache - use the actual ID from database
      this.instances.set(instance.id, instance);

      // Emit instance created event
      this.socketService.emitToAll('instance_created', instance);

      return instance;
    } catch (error) {
      console.error('Error creating instance:', error);
      throw new Error('Failed to create WhatsApp instance');
    }
  }

  private getAvailableEvolutionServer(): string {
    // Round-robin or load balancing logic
    const servers = [
      env.EVOLUTION_API_URL,
      env.EVOLUTION_API_URL_2,
      env.EVOLUTION_API_URL_3
    ].filter(Boolean);

    // For now, just return the first available
    return servers[0] || env.EVOLUTION_API_URL;
  }

  private getEvolutionApiKey(serverUrl: string): string {
    if (serverUrl === env.EVOLUTION_API_URL_2) return env.EVOLUTION_API_KEY_2 || env.EVOLUTION_API_KEY;
    if (serverUrl === env.EVOLUTION_API_URL_3) return env.EVOLUTION_API_KEY_3 || env.EVOLUTION_API_KEY;
    return env.EVOLUTION_API_KEY;
  }

  async getAllInstances(): Promise<WhatsAppInstance[]> {
    // If cache is empty, load from database
    if (this.instances.size === 0) {
      const dbInstances = await this.repository.findAll();
      dbInstances.forEach(instance => {
        this.instances.set(instance.id, instance);
      });
    }
    
    // Sync status with Evolution API for all instances
    console.log('🔄 [getAllInstances] Syncing status for all instances...');
    const instances = Array.from(this.instances.values());
    
    await Promise.all(
      instances.map(async (instance) => {
        try {
          const apiStatus = await this.evolutionApi.getInstanceStatus(instance.evolutionInstanceName);
          console.log(`🔍 [getAllInstances] Instance ${instance.name}: Current=${instance.status}, API=${apiStatus}`);
          
          // Se a instância não existe mais na Evolution API, deletar do banco
          if (apiStatus === InstanceStatus.NOT_FOUND) {
            console.log(`🗑️  [getAllInstances] Removendo instância ${instance.name} do banco (não existe mais na API)`);
            
            // Remover do cache
            this.instances.delete(instance.id);
            
            // Remover do banco de dados
            await this.repository.delete(instance.id);
            
            // Emitir evento de remoção
            this.socketService.emitToAll('instance_deleted', {
              instanceId: instance.id,
              name: instance.name,
              reason: 'not_found_in_api'
            });
            
            return; // Não processar mais esta instância
          }
          
          // Always try to get QR code if status is connecting
          if (apiStatus === InstanceStatus.CONNECTING) {
            try {
              const qrCodeString = await this.evolutionApi.getQRCode(instance.evolutionInstanceName);
              if (qrCodeString) {
                instance.qrCode = qrCodeString;
                instance.lastSeen = new Date();
              }
            } catch (qrError) {
              console.error(`⚠️ [getAllInstances] Could not get QR code for ${instance.name}:`, qrError);
            }
          }
          
          // Always update instance with latest status
          const statusChanged = instance.status !== apiStatus;
          instance.status = apiStatus;
          instance.connected = apiStatus === InstanceStatus.CONNECTED;
          instance.updatedAt = new Date();
          
          if (apiStatus === InstanceStatus.CONNECTED) {
            instance.connectedAt = new Date();
            // Clear QR code when connected
            delete instance.qrCode;
          }
          
          this.instances.set(instance.id, instance);
          
          // Update database if status changed or we have new QR code
          const needsUpdate = statusChanged || (apiStatus === InstanceStatus.CONNECTING && instance.qrCode);
          
          if (needsUpdate) {
            // Update database with all changes
            const updateData: Partial<WhatsAppInstance> = {
              status: apiStatus,
              connected: apiStatus === InstanceStatus.CONNECTED
            };
            
            if (instance.qrCode !== undefined) {
              updateData.qrCode = instance.qrCode;
            }
            
            if (instance.lastSeen !== undefined) {
              updateData.lastSeen = instance.lastSeen;
            }
            
            if (instance.connectedAt !== undefined) {
              updateData.connectedAt = instance.connectedAt;
            }
            
            await this.repository.update(instance.id, updateData);
            console.log(`💾 [getAllInstances] Database updated for ${instance.name}`);
            
            // Emit status change
            this.socketService.emitToInstance(instance.id, 'status_changed', {
              instanceId: instance.id,
              status: apiStatus,
              qrCode: instance.qrCode
            });
          }
        } catch (error) {
          console.error(`❌ [getAllInstances] Error syncing status for ${instance.name}:`, error);
        }
      })
    );
    
    return Array.from(this.instances.values());
  }

  async getInstanceById(instanceId: string): Promise<WhatsAppInstance | null> {
    // Try to get from cache first
    let instance = this.instances.get(instanceId) || null;
    
    // If not in cache, try database
    if (!instance) {
      const dbInstance = await this.repository.findById(instanceId);
      if (dbInstance) {
        this.instances.set(dbInstance.id, dbInstance);
        instance = dbInstance;
      }
    }
    
    return instance;
  }

  async deleteInstance(instanceId: string): Promise<void> {
    try {
      const instance = await this.getInstanceById(instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      // Delete from Evolution API
      await this.evolutionApi.deleteInstance(instance.evolutionInstanceName);

      // Delete from database
      await this.repository.delete(instanceId);

      // Remove from local storage
      this.instances.delete(instanceId);

      // Emit instance deleted event
      this.socketService.emitToAll('instance_deleted', { instanceId });
    } catch (error) {
      console.error('Error deleting instance:', error);
      throw new Error('Failed to delete WhatsApp instance');
    }
  }

  async connectInstance(instanceId: string): Promise<any> {
    try {
      const instance = await this.getInstanceById(instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      // Update status to connecting
      instance.status = InstanceStatus.CONNECTING;
      instance.updatedAt = new Date();
      this.instances.set(instanceId, instance);

      // Emit status change
      this.socketService.emitToInstance(instanceId, 'status_changed', {
        instanceId,
        status: InstanceStatus.CONNECTING
      });

      // Connect via Evolution API
      const result = await this.evolutionApi.connectInstance(instance.evolutionInstanceName);
      
      // Evolution API can return QR Code in two formats:
      // 1. result.qrcode.base64 (nested)
      // 2. result.base64 (direct)
      const qrCodeBase64 = result.qrcode?.base64 || result.base64;

      // Save QR Code if present
      if (qrCodeBase64) {
        instance.qrCode = qrCodeBase64;
        instance.updatedAt = new Date();
        this.instances.set(instanceId, instance);
        
        // Persist to database
        await this.repository.update(instanceId, {
          qrCode: qrCodeBase64,
          status: InstanceStatus.CONNECTING
        });

        // Emit QR code event
        this.socketService.emitToInstance(instanceId, 'qr_code', {
          instanceId,
          qrCode: qrCodeBase64
        });
      } else {
        console.warn('⚠️ [DEBUG] QR Code NOT found in response!');
        console.warn('⚠️ [DEBUG] Result structure:', Object.keys(result));
      }

      return result;
    } catch (error) {
      console.error('Error connecting instance:', error);
      
      // Update status to error
      const instance = await this.getInstanceById(instanceId);
      if (instance) {
        instance.status = InstanceStatus.ERROR;
        instance.updatedAt = new Date();
        this.instances.set(instanceId, instance);

        this.socketService.emitToInstance(instanceId, 'status_changed', {
          instanceId,
          status: InstanceStatus.ERROR
        });
      }

      throw new Error('Failed to connect WhatsApp instance');
    }
  }

  async disconnectInstance(instanceId: string): Promise<void> {
    try {
      const instance = await this.getInstanceById(instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      // Disconnect via Evolution API
      await this.evolutionApi.disconnectInstance(instance.evolutionInstanceName);

      // Update status
      instance.status = InstanceStatus.DISCONNECTED;
      instance.connected = false;
      instance.updatedAt = new Date();
      this.instances.set(instanceId, instance);

      // Emit status change
      this.socketService.emitToInstance(instanceId, 'status_changed', {
        instanceId,
        status: InstanceStatus.DISCONNECTED
      });
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      throw new Error('Failed to disconnect WhatsApp instance');
    }
  }

  async getQRCode(instanceId: string): Promise<string | null> {
    try {
      const instance = await this.getInstanceById(instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      const qrData = await this.evolutionApi.getQRCode(instance.evolutionInstanceName);
      
      if (qrData) {
        // Emit QR code via WebSocket
        this.socketService.emitToInstance(instanceId, 'qr_code', {
          instanceId,
          qrCode: qrData
        });
      }

      return qrData;
    } catch (error) {
      console.error('❌ [DEBUG getQRCode] Error getting QR code:', error);
      return null;
    }
  }

  async sendMessage(instanceId: string, number: string, text: string): Promise<any> {
    try {
      const instance = this.instances.get(instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      // 🔄 Check real-time status with Evolution API before sending
      console.log(`🔍 [sendMessage] Checking real-time status for instance ${instance.name}...`);
      const currentApiStatus = await this.evolutionApi.getInstanceStatus(instance.evolutionInstanceName);
      console.log(`🔍 [sendMessage] Instance ${instance.name}: Cached=${instance.status}, API=${currentApiStatus}`);

      // Update cached status if different
      if (instance.status !== currentApiStatus) {
        console.log(`🔄 [sendMessage] Updating cached status for ${instance.name} from ${instance.status} to ${currentApiStatus}`);
        instance.status = currentApiStatus;
        instance.connected = currentApiStatus === InstanceStatus.CONNECTED;
        instance.updatedAt = new Date();
        this.instances.set(instanceId, instance);

        // Update database
        await this.repository.update(instanceId, {
          status: currentApiStatus,
          connected: currentApiStatus === InstanceStatus.CONNECTED,
          updatedAt: new Date()
        });
      }

      if (currentApiStatus !== InstanceStatus.CONNECTED && currentApiStatus !== InstanceStatus.CONNECTING) {
        console.error(`❌ [sendMessage] Instance ${instance.name} is not connected! Status: ${currentApiStatus}`);
        throw new Error(`Instance is not connected (current status: ${currentApiStatus})`);
      }

      console.log(`✅ [sendMessage] Instance ${instance.name} is ${currentApiStatus}, proceeding with message send...`);

      // Format the remoteJid properly (WhatsApp format)
      const remoteJid = number.includes('@') ? number : `${number}@s.whatsapp.net`;

      // Use conversationService.sendMessageAtomic for atomic operations
      const result = await this.conversationService.sendMessageAtomic(
        instanceId,
        remoteJid,
        text
      );

      // Update last activity
      instance.lastSeen = new Date();
      instance.updatedAt = new Date();
      this.instances.set(instanceId, instance);

      console.log(`💬 Message sent and saved via conversationService for ${remoteJid} on instance ${instanceId}`);

      return result;
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Se for erro de WhatsApp não encontrado, propagar a mensagem específica
      if (error.message && error.message.includes('não possui WhatsApp')) {
        throw error; // Propagar o erro original com a mensagem específica
      }

      throw new Error('Failed to send message');
    }
  }

  async updateInstanceStatus(instanceId: string, status: InstanceStatus): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return;
    }

    instance.status = status;
    instance.connected = status === InstanceStatus.CONNECTED;
    
    if (status === InstanceStatus.CONNECTED) {
      instance.connectedAt = new Date();
    }
    
    instance.updatedAt = new Date();
    this.instances.set(instanceId, instance);

    // Emit status change
    this.socketService.emitToInstance(instanceId, 'status_changed', {
      instanceId,
      status
    });
  }

  async getInstanceByEvolutionName(evolutionInstanceName: string): Promise<WhatsAppInstance | null> {
    for (const instance of this.instances.values()) {
      if (instance.evolutionInstanceName === evolutionInstanceName) {
        return instance;
      }
    }
    return null;
  }

  async refreshInstanceStatus(instanceId: string): Promise<void> {
    try {
      const instance = this.instances.get(instanceId);
      if (!instance) {
        return;
      }

      const status = await this.evolutionApi.getInstanceStatus(instance.evolutionInstanceName);
      await this.updateInstanceStatus(instanceId, status);
    } catch (error) {
      console.error('Error refreshing instance status:', error);
      await this.updateInstanceStatus(instanceId, InstanceStatus.ERROR);
    }
  }
}