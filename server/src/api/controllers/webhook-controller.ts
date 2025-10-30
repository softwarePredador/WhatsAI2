import { Request, Response } from 'express';
import { z } from 'zod';
import { WebhookEvent } from '../../types';
import { SocketService } from '../../services/socket-service';
import { ConversationService } from '../../services/conversation-service';
import { EvolutionApiService } from '../../services/evolution-api';
import { prisma } from '../../database/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { webhookErrorLogger } from '../../utils/webhook-error-logger';
import { debounceService } from '../../services/debounce-service';
import { logger, LogContext } from '../../services/logger-service';
import {
  evolutionWebhookSchema,
  genericWebhookSchema,
  messagesUpsertSchema,
  messagesUpdateSchema,
  sendMessageSchema,
  contactsUpdateSchema,
  chatsUpsertSchema,
  presenceUpdateSchema,
  connectionUpdateSchema,
  qrcodeUpdatedSchema,
  type EvolutionWebhook,
  type MessagesUpsertWebhook,
  type MessagesUpdateWebhook,
  type ContactsUpdateWebhook,
  type ChatsUpsertWebhook
} from '../../schemas/webhook-schemas';

// Legacy schema for backward compatibility (deprecated)
const legacyWebhookEventSchema = z.object({
  event: z.string().optional(),
  data: z.record(z.any()).optional(),
  datetime: z.string().optional(),
  sender: z.string().optional(),
  serverUrl: z.string().optional(),
  instanceKey: z.string().optional(),
  instanceName: z.string().optional(),
}).passthrough(); // Allow additional properties

export class WebhookController {
  private socketService: SocketService;
  private conversationService: ConversationService;
  private evolutionApiService: EvolutionApiService;
  private webhookLogPath: string;

  constructor() {
    this.socketService = SocketService.getInstance();
    this.conversationService = new ConversationService();
    this.evolutionApiService = new EvolutionApiService();
    this.webhookLogPath = path.join(process.cwd(), 'webhook-logs.txt');

    // Inicializar debounce service
    debounceService.initialize();
    logger.info(LogContext.WEBHOOK, 'Debounce service initialized in webhook controller');

    // Criar arquivo de log se não existir
    if (!fs.existsSync(this.webhookLogPath)) {
      fs.writeFileSync(this.webhookLogPath, '=== WEBHOOK LOGS - INÍCIO ===\n\n', 'utf8');
    }
  }

  private logWebhook(webhookData: any, instanceId: string): void {
    // Logging reativado para debug
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `
[${timestamp}] INSTANCE: ${instanceId}
=== WEBHOOK DATA ===
${JSON.stringify(webhookData, null, 2)}
=== RAW BODY ===
${JSON.stringify(webhookData, null, 2)}
=== EXTRACTED INFO ===
Event: ${webhookData.event || 'N/A'}
RemoteJid: ${webhookData.data?.key?.remoteJid || webhookData.data?.remoteJid || 'N/A'}
RemoteJidAlt: ${webhookData.data?.key?.remoteJidAlt || 'N/A'}
PushName: ${webhookData.data?.pushName || 'N/A'}
Message: ${webhookData.data?.message ? JSON.stringify(webhookData.data.message).substring(0, 200) + '...' : 'N/A'}
=== END ENTRY ===

`;

      fs.appendFileSync(this.webhookLogPath, logEntry, 'utf8');
    } catch (error) {
      console.error('❌ [WEBHOOK LOG] Failed to save webhook:', error);
    }
  }

  handleEvolutionWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`🚨 [WEBHOOK] Body type: ${typeof req.body}, isBuffer: ${Buffer.isBuffer(req.body)}`);

      let webhookData: any;

      // Handle different body types
      if (Buffer.isBuffer(req.body)) {
        try {
          // Try to parse as JSON
          const bodyString = req.body.toString('utf8');
          webhookData = JSON.parse(bodyString);
        } catch (parseError) {
          webhookData = { rawData: req.body };
        }
      } else {
        webhookData = req.body;
      }

      console.log(`🚨 [WEBHOOK] Body:`, JSON.stringify(webhookData, null, 2));

      const { instanceId } = req.params;


      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }

      // Only validate with schema if we have JSON data
      if (webhookData.rawData) {
        res.status(200).json({
          success: true,
          message: 'Raw webhook data received'
        });
        return;
      }

      // 🎯 FASE 1 - MUDANÇA 3: Validação robusta com schemas Zod específicos
      let validatedWebhookData: EvolutionWebhook | any;
      
      try {
        // Tentar validação com schema discriminado (recomendado)
        validatedWebhookData = evolutionWebhookSchema.parse(webhookData);
      } catch (validationError: any) {
        // Fallback: usar schema genérico para eventos não mapeados
        validatedWebhookData = genericWebhookSchema.parse(webhookData);
      }

      // Log the webhook for debugging
      this.logWebhook(validatedWebhookData, instanceId);

      // 🔍 LOG DO EVENTO PARA DEBUG
      console.log(`🔍 [WEBHOOK] Dados do webhook:`, JSON.stringify(validatedWebhookData, null, 2));
      
      // � SALVAR LOG DO WEBHOOK para análise posterior
      let webhookLogData: any = {
        instanceId: instanceId,
        event: validatedWebhookData.event,
        rawData: validatedWebhookData,
        hasLid: false,
        hasAltField: false
      };
      
      // �🗺️ [DEBUG] Log específico para detectar campos @lid
      if (validatedWebhookData.event === 'messages.upsert') {
        const msgData = validatedWebhookData.data;
        if (msgData?.key) {
          console.log(`🗺️ [WEBHOOK_DEBUG] Key completa:`, JSON.stringify(msgData.key, null, 2));
          console.log(`🗺️ [WEBHOOK_DEBUG] Campos disponíveis:`, Object.keys(msgData.key));
          
          // Extrair campos para o log
          webhookLogData.remoteJid = msgData.key.remoteJid;
          webhookLogData.remoteJidAlt = msgData.key.remoteJidAlt;
          webhookLogData.participant = msgData.key.participant;
          webhookLogData.participantAlt = msgData.key.participantAlt;
          webhookLogData.messageId = msgData.key.id;
          
          if (msgData.key.participant?.includes('@lid')) {
            console.log(`🚨 [WEBHOOK_DEBUG] @LID DETECTADO no participant!`);
            console.log(`   participant: ${msgData.key.participant}`);
            console.log(`   participantAlt: ${msgData.key.participantAlt || 'NÃO EXISTE'}`);
            webhookLogData.hasLid = true;
            webhookLogData.hasAltField = !!msgData.key.participantAlt;
          }
          
          if (msgData.key.remoteJid?.includes('@lid')) {
            console.log(`🚨 [WEBHOOK_DEBUG] @LID DETECTADO no remoteJid!`);
            console.log(`   remoteJid: ${msgData.key.remoteJid}`);
            console.log(`   remoteJidAlt: ${msgData.key.remoteJidAlt || 'NÃO EXISTE'}`);
            webhookLogData.hasLid = true;
            webhookLogData.hasAltField = !!msgData.key.remoteJidAlt;
          }
        }
      }

      // Salvar log no banco (não bloquear processamento se falhar)
      prisma.webhookLog.create({ data: webhookLogData }).catch((err: any) => {
        console.error(`❌ [WEBHOOK_LOG] Erro ao salvar log:`, err);
      });

      // 🔍 Check if instance exists in database
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { evolutionInstanceName: instanceId }
      });

      if (!instance) {
        res.status(200).json({
          success: true,
          message: 'Webhook ignored - instance not found in database'
        });
        return;
      }

      console.log(`✅ [WEBHOOK] Instance found: ${instance.name} (ID: ${instance.id})`);

      // 🔍 LOG ANTES DA CONDIÇÃO PRINCIPAL
      console.log(`🔍 [WEBHOOK] Verificando webhookData.data:`, {
        hasData: !!validatedWebhookData.data,
        dataType: typeof validatedWebhookData.data,
        event: validatedWebhookData.event
      });

      // Process different types of webhook events
      if (validatedWebhookData.data && typeof validatedWebhookData.data === 'object') {
        
        // 🗺️ CRITICAL: Capture @lid to real number mapping from messages.update
        if (validatedWebhookData.event === 'messages.update') {
          
          // Validar com schema específico para garantir type-safety
          const validated = messagesUpdateSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [MESSAGES_UPDATE] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'messages.update',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid messages.update schema: ${validated.error.message}`);
          }
          
          const updates = Array.isArray(validated.data.data) ? validated.data.data : [validated.data.data];
          
          for (const data of updates) {
            const remoteJid = data.remoteJid;
            const keyId = data.key?.id || data.keyId;
            const status = data.status;
            
            // 🗺️ Mapear @lid → número real
            if (remoteJid && keyId) {
              if (remoteJid.includes('@lid')) {
                console.log(`🗺️ Found @lid in update: ${remoteJid} (keyId: ${keyId})`);
                await this.conversationService.recordLidMapping(keyId, remoteJid, null);
              } else if (remoteJid.includes('@s.whatsapp.net')) {
                console.log(`🗺️ Found real number in update: ${remoteJid} (keyId: ${keyId})`);
                await this.conversationService.recordLidMapping(keyId, null, remoteJid);
              }
            }
            
            // ✅ Atualizar status da mensagem (SENT → DELIVERED → READ)
            if (keyId && status) {
              await this.conversationService.handleMessageStatusUpdate(instanceId, {
                messageId: keyId,
                status: status.toUpperCase(),
                ...(remoteJid && { remoteJid }) // Só inclui se definido
              });
            }
          }
        }
        
        // 📥 Process incoming messages (MESSAGES_UPSERT) - ATOMIC VERSION
        if (validatedWebhookData.event === 'messages.upsert' && validatedWebhookData.data['key'] && validatedWebhookData.data['message']) {
          console.log(`💬 [MESSAGES_UPSERT] Processing message for instance ${instanceId} (ATOMIC)`);
          
          // Validar com schema específico
          const validated = messagesUpsertSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [MESSAGES_UPSERT] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'messages.upsert',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid messages.upsert schema: ${validated.error.message}`);
          }
          
          console.log(`💬 [MESSAGES_UPSERT] Message data:`, JSON.stringify(validated.data.data, null, 2));
          await this.conversationService.handleIncomingMessageAtomic(instanceId, validated.data.data);

          // ✅ Nome do grupo agora é buscado automaticamente dentro de handleIncomingMessageAtomic
          // quando detecta @g.us no remoteJid. Não precisa mais fazer busca separada aqui.
        }
        
        // 📤 Process sent messages (SEND_MESSAGE) - MENSAGENS ENVIADAS PELO USUÁRIO!
        if (validatedWebhookData.event === 'send.message' && validatedWebhookData.data['key'] && validatedWebhookData.data['message']) {
          
          // Validar com schema específico
          const validated = sendMessageSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [SEND_MESSAGE] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'send.message',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid send.message schema: ${validated.error.message}`);
          }
          
          console.log(`📤 [SEND_MESSAGE] Message data:`, JSON.stringify(validated.data.data, null, 2));
          
          // ⚠️ NÃO PROCESSAR AQUI - messages.upsert já processa esta mensagem
          // O evento send.message é apenas informativo (status PENDING)
          // O processamento real acontece no messages.upsert subsequente
        }
        
        // 👤 Process contact updates (CONTACTS_UPDATE) - FOTO E NOME AUTOMÁTICOS!
        if (validatedWebhookData.event === 'contacts.update') {
          
          // Validar com schema específico
          const validated = contactsUpdateSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [CONTACTS_UPDATE] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'contacts.update',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid contacts.update schema: ${validated.error.message}`);
          }
          
          // Pode vir como array ou objeto
          const contacts = Array.isArray(validated.data.data) ? validated.data.data : [validated.data.data];
          console.log(`👤 [CONTACTS_UPDATE] Found ${contacts.length} contact(s) to update`);
          
          for (const contactData of contacts) {
            const remoteJid = contactData.remoteJid;
            const profilePicUrl = contactData.profilePicUrl;
            const pushName = contactData.pushName;
            
            
            if (remoteJid && (profilePicUrl || pushName)) {
              await this.conversationService.updateContactFromWebhook(instanceId, remoteJid, {
                ...(pushName && { contactName: pushName }),
                ...(profilePicUrl && { contactPicture: profilePicUrl })
              });

              // 🔍 [AUTO_DETECT] Quando foto de perfil é atualizada, verificar se há duplicata
              if (profilePicUrl) {
                try {
                  const { findDuplicatesByPicture, mergeConversations } = await import('../../utils/conversation-merger');
                  
                  // Buscar conversa que foi atualizada
                  const updatedConv = await prisma.conversation.findFirst({
                    where: { remoteJid, instanceId: instance.id }
                  });

                  if (updatedConv) {
                    // Verificar se é @lid ou número real
                    const isLid = remoteJid.includes('@lid');
                    const searchPattern = isLid 
                      ? { contains: '@s.whatsapp.net', not: { contains: '@lid' } }
                      : { contains: '@lid' };

                    // Buscar conversa com mesma foto mas JID diferente
                    const duplicate = await prisma.conversation.findFirst({
                      where: {
                        instanceId: instance.id,
                        contactPicture: profilePicUrl,
                        remoteJid: searchPattern,
                        id: { not: updatedConv.id }
                      }
                    });

                    if (duplicate) {
                      console.log(`🔀 [AUTO_DETECT] Duplicata detectada por foto de perfil!`);
                      console.log(`   Conv 1: ${updatedConv.remoteJid}`);
                      console.log(`   Conv 2: ${duplicate.remoteJid}`);
                      
                      // Decidir qual é @lid e qual é número real
                      const lidJid = isLid ? remoteJid : duplicate.remoteJid;
                      const realJid = isLid ? duplicate.remoteJid : remoteJid;

                      // Unificar automaticamente
                      const mergeResult = await mergeConversations(lidJid, realJid);
                      console.log(`✅ [AUTO_MERGE] Unificação automática concluída: ${mergeResult.messagesMigrated} mensagens`);
                    }
                  }
                } catch (autoMergeError) {
                  console.error(`❌ [AUTO_DETECT] Erro ao detectar/unificar duplicata:`, autoMergeError);
                  // Não falhar o processamento do webhook
                }
              }
            } else {
            }
          }
        }
        
        // 💬 Process chat updates (CHATS_UPSERT) - CONTADOR DE NÃO LIDAS!
        if (validatedWebhookData.event === 'chats.upsert') {
          // Validar com schema específico
          const validated = chatsUpsertSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [CHATS_UPSERT] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'chats.upsert',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid chats.upsert schema: ${validated.error.message}`);
          }
          
          try {
            const chatsData = Array.isArray(validated.data.data) ? validated.data.data : [validated.data.data];
            
            // Aplicar throttle - processa no máximo 1 vez por segundo por instância
            const processChats = debounceService.throttleChatUpsert(
              async (data: { instanceId: string; chats: typeof chatsData }) => {
                for (const chat of data.chats) {
                  const remoteJid = chat.remoteJid;
                  const unreadMessages = chat.unreadMessages || 0;

                  if (remoteJid) {
                    await this.conversationService.updateUnreadCount(data.instanceId, remoteJid, unreadMessages);
                  }
                }
              },
              instanceId // Chave única por instância
            );
            
            // Chama função throttled
            processChats({ instanceId, chats: chatsData });
          } catch (error) {
            console.error(`❌ [CHATS_UPSERT] Error processing chats.upsert:`, error);
            throw error; // Re-throw to cause 500 instead of silent failure
          }
        }
        
        // 🟢 Process presence updates (PRESENCE_UPDATE) - DIGITANDO/ONLINE!
        if (validatedWebhookData.event === 'presence.update') {
          // Validar com schema específico
          const validated = presenceUpdateSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [PRESENCE_UPDATE] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'presence.update',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid presence.update schema: ${validated.error.message}`);
          }
          
          const presenceData = validated.data.data;
          const contactId = presenceData.id;
          const presences = presenceData.presences || {};
          const presence = presences[contactId];
          
          if (presence) {
            const status = presence.lastKnownPresence; // composing, available, unavailable
            
            // Aplicar debounce - apenas processa a última mudança de presença em 2s
            const processPresence = debounceService.debouncePresenceUpdate(
              (data: { contactId: string; status: string; instanceId: string }) => {
                
                // Emitir para o frontend via WebSocket
                this.socketService.emitToInstance(data.instanceId, 'presence:update', {
                  contactId: data.contactId,
                  status: data.status,
                  isTyping: data.status === 'composing',
                  isOnline: data.status === 'available'
                });
              },
              contactId // Chave única por contato
            );
            
            // Chama função debounced
            processPresence({ contactId, status, instanceId });
          }
        }
        
        // 🔗 Process connection updates (CONNECTION_UPDATE) - CRÍTICO!
        if (validatedWebhookData.event === 'connection.update') {
          // Validar com schema específico
          const validated = connectionUpdateSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [CONNECTION_UPDATE] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'connection.update',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid connection.update schema: ${validated.error.message}`);
          }
          
          const state = validated.data.data.state; // open, close, connecting
          const statusCode = validated.data.data.statusCode;
          
          // Mapear state para InstanceStatus
          let instanceStatus: string;
          if (state === 'open') {
            instanceStatus = 'CONNECTED';
          } else if (state === 'connecting') {
            instanceStatus = 'CONNECTING';
          } else if (state === 'close') {
            instanceStatus = 'DISCONNECTED';
          } else {
            instanceStatus = 'DISCONNECTED'; // fallback
          }
          
          // Atualizar instância no banco
          try {
            const instance = await prisma.whatsAppInstance.findUnique({
              where: { evolutionInstanceName: instanceId }
            });
            
            if (instance) {
              await prisma.whatsAppInstance.update({
                where: { id: instance.id },
                data: {
                  status: instanceStatus,
                  connected: instanceStatus === 'CONNECTED',
                  updatedAt: new Date()
                }
              });
              
              // Emitir para frontend
              this.socketService.emitToInstance(instance.id, 'instance:status', {
                status: instanceStatus,
                state,
                statusCode,
                connected: instanceStatus === 'CONNECTED'
              });
              
            }
          } catch (error) {
            console.error(`❌ [CONNECTION_UPDATE] Erro ao atualizar:`, error);
          }
        }
        
        // 📱 Process QR code updates (QRCODE_UPDATED) - CRÍTICO para UX!
        if (validatedWebhookData.event === 'qrcode.updated') {
          // Validar com schema específico
          const validated = qrcodeUpdatedSchema.safeParse(validatedWebhookData);
          if (!validated.success) {
            console.error(`❌ [QRCODE_UPDATED] Schema validation failed:`, validated.error.errors);
            
            // Registrar erro no log
            webhookErrorLogger.logValidationError(
              instanceId,
              'qrcode.updated',
              validated.error.errors,
              validatedWebhookData
            );
            
            throw new Error(`Invalid qrcode.updated schema: ${validated.error.message}`);
          }
          
          const qrCode = validated.data.data.qrcode; // base64
          
          if (qrCode) {
            try {
              const instance = await prisma.whatsAppInstance.findUnique({
                where: { evolutionInstanceName: instanceId }
              });
              
              if (instance) {
                // Salvar QR no banco
                await prisma.whatsAppInstance.update({
                  where: { id: instance.id },
                  data: {
                    qrCode,
                    lastSeen: new Date(),
                    updatedAt: new Date()
                  }
                });
                
                // Emitir novo QR para frontend via WebSocket
                this.socketService.emitToInstance(instance.id, 'qrcode:updated', {
                  qrCode,
                  timestamp: new Date().toISOString()
                });
                
              }
            } catch (error) {
              console.error(`❌ [QRCODE_UPDATED] Erro ao atualizar QR:`, error);
            }
          }
        }
        
        // Handle other webhook events (status changes, etc.)
        if (webhookData.data['status']) {
        }
      }

      // Emit event via WebSocket
      this.socketService.emitToInstance(instanceId, 'evolution_event', webhookData);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid webhook data',
          details: error.errors
        });
        return;
      }

      console.error('Error processing Evolution webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  };

  handleMessageWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }

      const messageData = req.body;
      

      // Process message and emit via WebSocket
      this.socketService.emitToInstance(instanceId, 'message_received', messageData);

      res.status(200).json({
        success: true,
        message: 'Message webhook processed successfully'
      });
    } catch (error) {
      console.error('Error processing message webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message webhook'
      });
    }
  };

  handleStatusWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }

      const statusData = req.body;
      

      // Process status change and emit via WebSocket
      this.socketService.emitToInstance(instanceId, 'status_changed', statusData);

      res.status(200).json({
        success: true,
        message: 'Status webhook processed successfully'
      });
    } catch (error) {
      console.error('Error processing status webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process status webhook'
      });
    }
  };
}