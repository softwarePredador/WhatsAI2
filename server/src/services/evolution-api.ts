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
  
  // Cache de falhas de foto de perfil: Map<número, { tentativas: number, bloqueadoAte: Date }>
  private profilePictureFailCache = new Map<string, { attempts: number, blockedUntil: Date }>();
  private readonly MAX_ATTEMPTS = 2; // Máximo de tentativas
  private readonly BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

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
      const webhookUrl = `${env.WEBHOOK_URL}/${instanceData.name}`;
      
      console.log(`📱 Criando instância: ${instanceData.name}`);
      console.log(`🔗 Webhook configurado: ${webhookUrl}`);
      
      // Criar instância COM webhook no formato correto (objeto)
      const response = await this.client.post('/instance/create', {
        instanceName: instanceData.name,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: [
            // 🔴 CRÍTICOS - Necessários para @lid resolution
            'MESSAGES_UPSERT',      // Recebe mensagens novas (com @lid)
            'MESSAGES_UPDATE',      // Resolve @lid → número real via status updates
            
            // 🟡 IMPORTANTES - Gerenciamento de conexão
            'CONNECTION_UPDATE',    // Monitora status da conexão
            'QRCODE_UPDATED',       // Novo QR code quando necessário
            
            // 🟢 ÚTEIS - Enriquecimento de dados
            'CONTACTS_UPSERT',      // Informações de contatos (nome, foto)
            'CONTACTS_UPDATE',      // Atualizações de contatos
            'CHATS_UPSERT',         // Informações de conversas
            'PRESENCE_UPDATE',      // Status online/typing
            
            // 📤 ENVIO - Confirmação de mensagens enviadas
            'SEND_MESSAGE'
          ]
        }
      });

      console.log(`✅ Instância criada com webhook configurado: ${instanceData.name}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating Evolution API instance:');
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        requestData: error.config?.data
      });
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

  async setWebhook(instanceName: string): Promise<any> {
    try {
      const webhookUrl = `${env.WEBHOOK_URL}/${instanceName}`;
      
      console.log(`🔗 Configurando webhook para ${instanceName}: ${webhookUrl}`);
      
      const response = await this.client.post(`/webhook/set/${instanceName}`, {
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: [
          // 🔴 CRÍTICOS - Necessários para @lid resolution
          'MESSAGES_UPSERT',      // Recebe mensagens novas (com @lid)
          'MESSAGES_UPDATE',      // Resolve @lid → número real via status updates
          
          // 🟡 IMPORTANTES - Gerenciamento de conexão
          'CONNECTION_UPDATE',    // Monitora status da conexão
          'QRCODE_UPDATED',       // Novo QR code quando necessário
          
          // 🟢 ÚTEIS - Enriquecimento de dados
          'CONTACTS_UPSERT',      // Informações de contatos (nome, foto)
          'CONTACTS_UPDATE',      // Atualizações de contatos
          'CHATS_UPSERT',         // Informações de conversas
          'PRESENCE_UPDATE',      // Status online/typing
          
          // 📤 ENVIO - Confirmação de mensagens enviadas
          'SEND_MESSAGE'
        ]
      });

      console.log(`✅ Webhook configurado para ${instanceName}`);
      return response.data;
    } catch (error) {
      console.error(`Error setting webhook for ${instanceName}:`, error);
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
      
      console.log(`🔍 [getInstanceStatus] Instance ${instanceName} state:`, state);
      
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
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`⚠️  Instância ${instanceName} não encontrada na Evolution API (404) - será removida do banco`);
        return InstanceStatus.NOT_FOUND;
      }
      console.error('Error getting Evolution API instance status:', error.message || error);
      return InstanceStatus.DISCONNECTED;
    }
  }

  async getQRCode(instanceName: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`);
      const { data } = response;

      // Priorizar base64 (imagem completa) em vez de apenas o código
      if (data && (data.base64 || data.qrcode || data.qr || data.code)) {
        return data.base64 || data.qrcode || data.qr || data.code;
      }

      return null;
    } catch (error: any) {
      // Reduzir log - só mostrar erro se não for 404 (QR não disponível ainda)
      if (error.response?.status !== 404) {
        console.error('❌ [EvolutionAPI getQRCode] Error:', error.message);
      }
      return null;
    }
  }

  async checkIsWhatsApp(instanceName: string, numbers: string[]): Promise<any> {
    try {
      console.log(`🔍 [EvolutionAPI checkIsWhatsApp] Verificando números:`, numbers);
      
      const payload = {
        numbers: numbers
      };
      
      const response = await this.client.post(`/chat/whatsappNumbers/${instanceName}`, payload);
      console.log(`✅ [EvolutionAPI checkIsWhatsApp] Resposta:`, response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [EvolutionAPI checkIsWhatsApp] Error:', error);
      throw error;
    }
  }

  async sendTextMessage(instanceName: string, number: string, text: string): Promise<any> {
    try {
      // Garantir que o número esteja no formato correto do WhatsApp (sem @s.whatsapp.net para Evolution API)
      const cleanNumber = number.includes('@') ? number.replace('@s.whatsapp.net', '').replace('@g.us', '') : number;

      console.log(`📤 [sendTextMessage] Sending message to ${cleanNumber} via instance ${instanceName}`);
      console.log(`📤 [sendTextMessage] Original number: ${number}, Clean number: ${cleanNumber}`);

      // TEMPORARIAMENTE DESABILITADO: Verificar se o número tem WhatsApp antes de enviar
      console.log(`⚠️ [sendTextMessage] Skipping WhatsApp number validation (temporarily disabled)`);
      /*
      // Verificar se o número tem WhatsApp antes de enviar
      console.log(`🔍 [sendTextMessage] Verificando se ${formattedNumber} tem WhatsApp...`);

      const whatsappCheck = await this.checkIsWhatsApp(instanceName, [formattedNumber]);

      // A resposta geralmente vem como array de objetos com exists: boolean
      const numberInfo = whatsappCheck.find((info: any) =>
        info.jid === formattedNumber || info.number === formattedNumber
      );

      if (!numberInfo || !numberInfo.exists) {
        console.log(`❌ [sendTextMessage] Número ${formattedNumber} não tem WhatsApp`);
        throw new Error(`O número ${number} não possui WhatsApp`);
      }

      console.log(`✅ [sendTextMessage] Número ${formattedNumber} tem WhatsApp, enviando mensagem...`);
      */

      // Formato correto baseado na documentação Evolution API v2
      const payload = {
        number: cleanNumber,
        text: text,
        delay: 1200,
        linkPreview: false
      };

      console.log(`📤 [sendTextMessage] Payload:`, JSON.stringify(payload, null, 2));
      console.log(`📤 [sendTextMessage] URL: /message/sendText/${instanceName}`);

      const response = await this.client.post(`/message/sendText/${instanceName}`, payload);
      console.log(`✅ [sendTextMessage] Success response:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [sendTextMessage] Error details:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response) {
          console.error('❌ [sendTextMessage] Response status:', axiosError.response.status);
          console.error('❌ [sendTextMessage] Response data:', axiosError.response.data);
        }
      }
      throw error;
    }
  }

  async sendMediaMessage(instanceName: string, number: string, mediaUrl: string, caption?: string, mediaType?: string): Promise<any> {
    try {
      // Download the file from the URL and convert to base64
      console.log(`📥 [sendMediaMessage] Downloading media from: ${mediaUrl}`);
      const mediaResponse = await this.client.get(mediaUrl, { responseType: 'arraybuffer' });
      const base64Data = Buffer.from(mediaResponse.data).toString('base64');

      // Extract mimetype from response headers
      const mimetype = mediaResponse.headers['content-type'] || 'application/octet-stream';
      
      // Extract filename from URL or generate one
      const urlParts = mediaUrl.split('/');
      const originalFileName = urlParts[urlParts.length - 1] || 'file';
      const fileName = originalFileName.includes('.') ? originalFileName : `file.${this.getExtensionFromMimeType(mimetype)}`;

      console.log(`✅ [sendMediaMessage] Media downloaded and converted to base64 (${base64Data.length} chars)`);
      console.log(`📄 [sendMediaMessage] MIME type: ${mimetype}, File name: ${fileName}`);

      const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
        number: number,
        mediatype: mediaType || this.getMediaTypeFromMimeType(mimetype),
        mimetype: mimetype,
        caption: caption || '',
        media: base64Data,
        fileName: fileName,
        delay: 1200
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

  async markMessageAsRead(instanceName: string, messages: Array<{
    remoteJid: string;
    fromMe: boolean;
    id: string;
  }>): Promise<{ message: string; read: string }> {
    try {
      console.log(`📖 Marking messages as read for instance ${instanceName}`);
      
      const response = await this.client.post(`/chat/markMessageAsRead/${instanceName}`, {
        readMessages: messages
      });

      console.log(`✅ Messages marked as read successfully`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error marking messages as read:', error.response?.data || error.message);
      throw new Error(`Failed to mark messages as read: ${error.response?.data?.message || error.message}`);
    }
  }

  async markChatAsUnread(instanceName: string, chat: string, lastMessage: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  }): Promise<{ message: string; read: string }> {
    try {
      console.log(`📪 Marking chat as unread for instance ${instanceName}, chat: ${chat}`);
      
      // Formato correto baseado nos testes com a Evolution API
      const payload = {
        chat: chat,
        lastMessage: {
          remoteJid: lastMessage.remoteJid,
          fromMe: lastMessage.fromMe,
          id: lastMessage.id,
          key: {
            remoteJid: lastMessage.remoteJid,
            fromMe: lastMessage.fromMe,
            id: lastMessage.id
          }
        }
      };
      
      const response = await this.client.post(`/chat/markChatUnread/${instanceName}`, payload);

      console.log(`✅ Chat marked as unread successfully`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error marking chat as unread:', error.response?.data || error.message);
      throw new Error(`Failed to mark chat as unread: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Fetch profile picture URL for a contact
   * @param instanceName - Nome da instância
   * @param number - Número do contato (formato: 5511999999999 ou 5511999999999@s.whatsapp.net)
   * @returns URL da foto de perfil
   */
  async fetchProfilePictureUrl(instanceName: string, number: string): Promise<{
    profilePictureUrl: string | null;
  }> {
    try {
      // Verificar se o número está bloqueado temporariamente
      const cacheKey = `${instanceName}:${number}`;
      const cachedFailure = this.profilePictureFailCache.get(cacheKey);
      
      if (cachedFailure) {
        const now = new Date();
        
        // Se ainda está bloqueado, retornar null sem tentar
        if (now < cachedFailure.blockedUntil) {
          const hoursRemaining = Math.ceil((cachedFailure.blockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60));
          console.log(`⏳ Profile picture fetch bloqueado para ${number} (tentará novamente em ~${hoursRemaining}h)`);
          return { profilePictureUrl: null };
        }
        
        // Se o bloqueio expirou, remover do cache
        this.profilePictureFailCache.delete(cacheKey);
      }
      
      console.log(`📸 Fetching profile picture for ${number} on instance ${instanceName}`);
      
      // Endpoint correto segundo documentação: fetchProfilePictureUrl (com 'u' minúsculo)
      const response = await this.client.post(`/chat/fetchProfilePictureUrl/${instanceName}`, {
        number: number
      });

      console.log(`✅ Profile picture fetched successfully:`, response.data?.profilePictureUrl ? 'Found' : 'Not found');
      
      // Se teve sucesso e estava no cache de falhas, remover
      if (cachedFailure) {
        this.profilePictureFailCache.delete(cacheKey);
      }
      
      return {
        profilePictureUrl: response.data?.profilePictureUrl || null
      };
    } catch (error: any) {
      console.error('❌ Error fetching profile picture:', error.response?.data || error.message);
      
      // Gerenciar cache de falhas
      const cacheKey = `${instanceName}:${number}`;
      const cachedFailure = this.profilePictureFailCache.get(cacheKey);
      
      if (cachedFailure) {
        // Incrementar tentativas
        cachedFailure.attempts++;
        
        // Se atingiu o máximo de tentativas, bloquear por 24h
        if (cachedFailure.attempts >= this.MAX_ATTEMPTS) {
          cachedFailure.blockedUntil = new Date(Date.now() + this.BLOCK_DURATION_MS);
          console.log(`🚫 Número ${number} bloqueado após ${cachedFailure.attempts} tentativas. Próxima tentativa: ${cachedFailure.blockedUntil.toLocaleString('pt-BR')}`);
        }
      } else {
        // Primeira falha, adicionar ao cache
        this.profilePictureFailCache.set(cacheKey, {
          attempts: 1,
          blockedUntil: new Date(0) // Não bloqueado ainda
        });
      }
      
      // Retorna null em vez de lançar erro, pois nem todos os contatos têm foto
      return { profilePictureUrl: null };
    }
  }

  /**
   * Fetch contact information (name, profile picture, etc)
   * @param instanceName - Nome da instância
   * @param numbers - Array de números para buscar
   * @returns Array com informações dos contatos
   */
  async fetchContacts(instanceName: string, numbers?: string[]): Promise<Array<{
    id: string;
    profilePictureUrl?: string;
    pushName?: string;
    businessName?: string;
    profileName?: string;
  }>> {
    try {
      console.log(`👥 Fetching contacts for instance ${instanceName}`);
      
      const payload: any = {};
      if (numbers && numbers.length > 0) {
        payload.where = numbers.map(num => ({ id: num }));
      }

      const response = await this.client.post(`/chat/findContacts/${instanceName}`, payload);

      console.log(`✅ Contacts fetched successfully: ${response.data?.length || 0} contacts`);
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching contacts:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get contact name with fallback logic
   * Priority: businessName > pushName > profileName > number
   */
  getContactDisplayName(contact: {
    pushName?: string;
    businessName?: string;
    profileName?: string;
    id?: string;
  }, fallbackNumber?: string): string {
    if (contact.businessName) return contact.businessName;
    if (contact.pushName) return contact.pushName;
    if (contact.profileName) return contact.profileName;
    
    // Se tiver ID, formatar como número
    if (contact.id) {
      const cleaned = contact.id.replace('@s.whatsapp.net', '').replace('@g.us', '');
      return this.formatPhoneNumber(cleaned);
    }
    
    // Fallback para número fornecido
    if (fallbackNumber) {
      return this.formatPhoneNumber(fallbackNumber);
    }
    
    return 'Contato sem nome';
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimetype: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt'
    };
    return mimeToExt[mimetype] || 'bin';
  }

  /**
   * Get media type from MIME type for Evolution API
   */
  private getMediaTypeFromMimeType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Find group information by JID
   * @param instanceName - Nome da instância
   * @param groupJid - JID do grupo (ex: 120363129197033819@g.us)
   * @returns Informações detalhadas do grupo
   */
  async findGroupByJid(instanceName: string, groupJid: string): Promise<{
    id: string;
    subject: string;
    subjectOwner: string;
    subjectTime: number;
    pictureUrl?: string;
    size: number;
    creation: number;
    owner: string;
    desc?: string;
    descId?: string;
    restrict: boolean;
    announce: boolean;
    participants?: Array<{
      id: string;
      admin: string;
    }>;
  } | null> {
    try {
      console.log(`👥 Finding group info for ${groupJid} on instance ${instanceName}`);

      const response = await this.client.get(`/group/findGroupInfos/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`);

      console.log(`✅ Group info fetched successfully for ${groupJid}: ${response.data?.subject || 'No subject'}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error finding group by JID:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Fetch all groups for an instance
   * @param instanceName - Nome da instância
   * @param getParticipants - Se deve incluir participantes
   * @returns Array com informações de todos os grupos
   */
  async fetchAllGroups(instanceName: string, getParticipants: boolean = false): Promise<Array<{
    id: string;
    subject: string;
    subjectOwner: string;
    subjectTime: number;
    pictureUrl?: string;
    size: number;
    creation: number;
    owner: string;
    desc?: string;
    descId?: string;
    restrict: boolean;
    announce: boolean;
    participants?: Array<{
      id: string;
      admin: string;
    }>;
  }>> {
    try {
      console.log(`👥 Fetching all groups for instance ${instanceName}`);

      const response = await this.client.get(`/group/fetchAllGroups/${instanceName}?getParticipants=${getParticipants}`);

      console.log(`✅ All groups fetched successfully: ${response.data?.length || 0} groups`);
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching all groups:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Download encrypted media from WhatsApp using Evolution API
   * This method fetches and decrypts media that is stored encrypted on WhatsApp servers
   * @param instanceName - The Evolution API instance name
   * @param messageData - The complete message data from webhook containing encrypted media URL and keys
   * @returns Buffer with decrypted media content
   */
  async downloadMedia(instanceName: string, messageData: any): Promise<Buffer> {
    try {
      console.log(`🔐 [EvolutionAPI] Downloading encrypted media via Evolution API for instance ${instanceName}`);
      
      // Evolution API endpoint para baixar mídia descriptografada
      // Envia a mensagem completa com as chaves de criptografia
      const response = await this.client.post(`/message/downloadMedia/${instanceName}`, {
        message: messageData
      }, {
        responseType: 'arraybuffer', // Receber dados binários
        timeout: 60000 // 60 segundos para download de mídia grande
      });

      console.log(`✅ [EvolutionAPI] Media downloaded and decrypted successfully: ${response.data.byteLength} bytes`);
      
      // Converter ArrayBuffer para Buffer
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('❌ [EvolutionAPI] Error downloading media:', error.response?.data || error.message);
      throw new Error(`Failed to download media via Evolution API: ${error.message}`);
    }
  }

  /**
   * Format phone number for display
   * Example: 5511999999999 -> +55 (11) 99999-9999
   */
  private formatPhoneNumber(number: string): string {
    const cleaned = number.replace(/\D/g, '');
    
    // Formato brasileiro (55 + DDD + número)
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const country = cleaned.slice(0, 2);
      const ddd = cleaned.slice(2, 4);
      const firstPart = cleaned.slice(4, -4);
      const lastPart = cleaned.slice(-4);
      return `+${country} (${ddd}) ${firstPart}-${lastPart}`;
    }
    
    // Outros formatos internacionais
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    // Se não identificar formato, retorna como está
    return number;
  }
}