import { Request, Response } from 'express';
import { z } from 'zod';
import { WebhookEvent } from '../../types';
import { SocketService } from '../../services/socket-service';
import { ConversationService } from '../../services/conversation-service';
import { EvolutionApiService } from '../../services/evolution-api';
import { prisma } from '../../database/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Validation schema for webhook events (Evolution API format)
const webhookEventSchema = z.object({
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

    // Criar arquivo de log se não existir
    if (!fs.existsSync(this.webhookLogPath)) {
      fs.writeFileSync(this.webhookLogPath, '=== WEBHOOK LOGS - INÍCIO ===\n\n', 'utf8');
    }
  }

  private logWebhook(webhookData: any, instanceId: string): void {
    // Logging reativado para debug
    console.log(`📝 [LOG_WEBHOOK] Iniciando log para ${instanceId}, event: ${webhookData.event}`);
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
      console.log(`📝 [WEBHOOK LOG] Saved webhook to ${this.webhookLogPath}`);
    } catch (error) {
      console.error('❌ [WEBHOOK LOG] Failed to save webhook:', error);
    }
  }

  handleEvolutionWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`🚨 [WEBHOOK] ========================================`);
      console.log(`🚨 [WEBHOOK] Requisição chegou! Method: ${req.method}, Path: ${req.path}`);
      console.log(`🚨 [WEBHOOK] Body:`, JSON.stringify(req.body, null, 2));
      console.log(`🚨 [WEBHOOK] ========================================`);
      
      const { instanceId } = req.params;
      
      console.log(`🚨 [WEBHOOK] instanceId do params: ${instanceId}`);
      
      if (!instanceId) {
        console.log(`❌ [WEBHOOK] instanceId não fornecido!`);
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }

      const webhookData = webhookEventSchema.parse(req.body);

      // 🔍 LOG DO EVENTO PARA DEBUG
      console.log(`🔍 [WEBHOOK] Evento recebido: ${webhookData.event}`);
      console.log(`🔍 [WEBHOOK] Dados do webhook:`, JSON.stringify(webhookData, null, 2));

      // 🔍 Check if instance exists in database
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { evolutionInstanceName: instanceId }
      });

      if (!instance) {
        console.log(`⚠️ [WEBHOOK] Instance ${instanceId} not found in database - ignoring webhook`);
        res.status(200).json({
          success: true,
          message: 'Webhook ignored - instance not found in database'
        });
        return;
      }

      console.log(`✅ [WEBHOOK] Instance found: ${instance.name} (ID: ${instance.id})`);

      // 🔍 LOG ANTES DA CONDIÇÃO PRINCIPAL
      console.log(`🔍 [WEBHOOK] Verificando webhookData.data:`, {
        hasData: !!webhookData.data,
        dataType: typeof webhookData.data,
        event: webhookData.event
      });

      // Process different types of webhook events
      if (webhookData.data && typeof webhookData.data === 'object') {
        // 🗺️ CRITICAL: Capture @lid to real number mapping from messages.update
        if (webhookData.event === 'messages.update') {
          const updates = Array.isArray(webhookData.data) ? webhookData.data : [webhookData.data];
          
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
              console.log(`📬 [MESSAGES_UPDATE] Updating message ${keyId} status to: ${status}`);
              await this.conversationService.handleMessageStatusUpdate(instanceId, {
                messageId: keyId,
                status: status.toUpperCase(),
                remoteJid
              });
            }
          }
        }
        
        // 📥 Process incoming messages (MESSAGES_UPSERT) - ATOMIC VERSION
        if (webhookData.event === 'messages.upsert' && webhookData.data['key'] && webhookData.data['message']) {
          console.log(`💬 [MESSAGES_UPSERT] Processing message for instance ${instanceId} (ATOMIC)`);
          console.log(`💬 [MESSAGES_UPSERT] Message data:`, JSON.stringify(webhookData.data, null, 2));
          await this.conversationService.handleIncomingMessageAtomic(instanceId, webhookData.data);

          // 🎯 GROUP NAME AUTO-UPDATE: Se for mensagem de grupo, verificar se precisamos buscar nome
          const remoteJid = webhookData.data['key']?.remoteJid;
          if (remoteJid && remoteJid.endsWith('@g.us')) {
            console.log(`👥 [GROUP_CHECK] Message from group ${remoteJid}, checking if name needs update...`);

            try {
              // Verificar se o grupo já tem nome no banco
              const existingConversation = await prisma.conversation.findFirst({
                where: {
                  remoteJid: remoteJid,
                  instance: {
                    evolutionInstanceName: instanceId
                  }
                },
                select: {
                  id: true,
                  contactName: true,
                  isGroup: true
                }
              });

              console.log(`👥 [GROUP_CHECK] Found conversation in DB:`, existingConversation);

              // Se não tem nome ou nome é genérico (apenas números), buscar informações do grupo
              const needsNameUpdate = !existingConversation?.contactName ||
                existingConversation.contactName === remoteJid ||
                /^\d+$/.test(existingConversation.contactName.replace('@g.us', ''));

              console.log(`👥 [GROUP_CHECK] Needs name update: ${needsNameUpdate} (current: "${existingConversation?.contactName || 'none'}")`);

              if (needsNameUpdate) {
                console.log(`📝 [GROUP_UPDATE] Group ${remoteJid} needs name update. Current name: "${existingConversation?.contactName || 'none'}"`);

                // Buscar informações do grupo na Evolution API
                const groupInfo = await this.evolutionApiService.findGroupByJid(instanceId, remoteJid);
                console.log(`📝 [GROUP_UPDATE] Group info from API:`, groupInfo);

                if (groupInfo?.subject) {
                  console.log(`✅ [GROUP_UPDATE] Found group name: "${groupInfo.subject}" for ${remoteJid}`);

                  // Atualizar nome do grupo no banco
                  const updateResult = await prisma.conversation.updateMany({
                    where: {
                      remoteJid: remoteJid,
                      instance: {
                        evolutionInstanceName: instanceId
                      }
                    },
                    data: {
                      contactName: groupInfo.subject,
                      contactPicture: groupInfo.pictureUrl || null,
                      isGroup: true
                    }
                  });

                  console.log(`✅ [GROUP_UPDATE] Update result:`, updateResult);

                  // Notificar frontend sobre a atualização
                  this.socketService.emitToInstance(instanceId, 'conversation:updated', {
                    conversationId: existingConversation?.id,
                    contactName: groupInfo.subject,
                    contactPicture: groupInfo.pictureUrl
                  });
                } else {
                  console.log(`⚠️ [GROUP_UPDATE] Could not find group name for ${remoteJid}`);
                }
              } else {
                console.log(`✅ [GROUP_CHECK] Group ${remoteJid} already has name: "${existingConversation.contactName}"`);
              }
            } catch (error) {
              console.error(`❌ [GROUP_UPDATE] Error updating group name for ${remoteJid}:`, error);
            }
          }
        }
        
        // 📤 Process sent messages (SEND_MESSAGE) - MENSAGENS ENVIADAS PELO USUÁRIO!
        if (webhookData.event === 'send.message' && webhookData.data['key'] && webhookData.data['message']) {
          console.log(`📤 [SEND_MESSAGE] Processing sent message for instance ${instanceId}`);
          console.log(`📤 [SEND_MESSAGE] Message data:`, JSON.stringify(webhookData.data, null, 2));
          
          // Criar um messages.upsert artificial para reaproveitar a lógica existente
          const upsertData = {
            key: {
              ...webhookData.data['key'],
              fromMe: true
            },
            pushName: webhookData.data['pushName'] || 'Você',
            status: 'SENT',
            message: webhookData.data['message'],
            messageTimestamp: Math.floor(Date.now() / 1000),
            instanceId: webhookData.data['instanceId'],
            source: 'web'
          };
          
          console.log(`📤 [SEND_MESSAGE] Converting to upsert format:`, JSON.stringify(upsertData, null, 2));
          await this.conversationService.handleIncomingMessageAtomic(instanceId, upsertData);
        }
        
        // 👤 Process contact updates (CONTACTS_UPDATE) - FOTO E NOME AUTOMÁTICOS!
        console.log(`🔍 [WEBHOOK] Checking event: ${webhookData.event}`);
        if (webhookData.event === 'contacts.update') {
          console.log(`👤 [CONTACTS_UPDATE] Processing contacts update for instance ${instanceId}`);
          // Pode vir como array ou objeto
          const contacts = Array.isArray(webhookData.data) ? webhookData.data : [webhookData.data];
          console.log(`👤 [CONTACTS_UPDATE] Found ${contacts.length} contact(s) to update`);
          
          for (const contactData of contacts) {
            const remoteJid = contactData.remoteJid;
            const profilePicUrl = contactData.profilePicUrl;
            const pushName = contactData.pushName;
            
            console.log(`👤 [CONTACTS_UPDATE] Processing contact: remoteJid=${remoteJid}, pushName=${pushName}, hasPic=${!!profilePicUrl}`);
            
            if (remoteJid && (profilePicUrl || pushName)) {
              console.log(`👤 [CONTACTS_UPDATE] ${pushName || remoteJid}: foto=${!!profilePicUrl}, nome=${!!pushName}`);
              await this.conversationService.updateContactFromWebhook(instanceId, remoteJid, {
                contactName: pushName,
                contactPicture: profilePicUrl
              });
            } else {
              console.log(`👤 [CONTACTS_UPDATE] Skipping contact ${remoteJid} - no updates needed`);
            }
          }
        }
        
        // 💬 Process chat updates (CHATS_UPSERT) - CONTADOR DE NÃO LIDAS!
        if (webhookData.event === 'chats.upsert') {
          const chatsData = Array.isArray(webhookData.data) ? webhookData.data : [webhookData.data];
          for (const chat of chatsData) {
            const remoteJid = chat.remoteJid;
            const unreadMessages = chat.unreadMessages || 0;
            
            if (remoteJid) {
              console.log(`💬 [CHATS_UPSERT] Chat ${remoteJid}: ${unreadMessages} não lidas`);
              await this.conversationService.updateUnreadCount(instanceId, remoteJid, unreadMessages);
            }
          }
        }
        
        // 🟢 Process presence updates (PRESENCE_UPDATE) - DIGITANDO/ONLINE!
        if (webhookData.event === 'presence.update') {
          const presenceData = webhookData.data as any;
          const contactId = presenceData.id;
          const presences = presenceData.presences || {};
          const presence = presences[contactId];
          
          if (presence) {
            const status = presence.lastKnownPresence; // composing, available, unavailable
            console.log(`🟢 [PRESENCE_UPDATE] ${contactId}: ${status}`);
            
            // Emitir para o frontend via WebSocket
            this.socketService.emitToInstance(instanceId, 'presence:update', {
              contactId,
              status,
              isTyping: status === 'composing',
              isOnline: status === 'available'
            });
          }
        }
        
        // 🔗 Process connection updates (CONNECTION_UPDATE) - CRÍTICO!
        if (webhookData.event === 'connection.update') {
          const state = webhookData.data['state']; // open, close, connecting
          const statusCode = webhookData.data['statusCode'];
          console.log(`🔗 [CONNECTION_UPDATE] Instance ${instanceId}: state=${state}, code=${statusCode}`);
          
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
              
              console.log(`✅ [CONNECTION_UPDATE] Status atualizado: ${instanceStatus}`);
            }
          } catch (error) {
            console.error(`❌ [CONNECTION_UPDATE] Erro ao atualizar:`, error);
          }
        }
        
        // 📱 Process QR code updates (QRCODE_UPDATED) - CRÍTICO para UX!
        if (webhookData.event === 'qrcode.updated') {
          const qrCode = webhookData.data['qrcode']; // base64
          console.log(`📱 [QRCODE_UPDATED] New QR available for ${instanceId}`);
          
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
                
                console.log(`✅ [QRCODE_UPDATED] QR Code atualizado e emitido para frontend`);
              }
            } catch (error) {
              console.error(`❌ [QRCODE_UPDATED] Erro ao atualizar QR:`, error);
            }
          }
        }
        
        // Handle other webhook events (status changes, etc.)
        if (webhookData.data['status']) {
          console.log(`📊 Processing status change for instance ${instanceId}: ${webhookData.data['status']}`);
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
      
      console.log(`Received message webhook for instance ${instanceId}:`, messageData);

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
      
      console.log(`Received status webhook for instance ${instanceId}:`, statusData);

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