import { Request, Response } from 'express';
import { z } from 'zod';
import { WebhookEvent } from '../../types';
import { SocketService } from '../../services/socket-service';
import { ConversationService } from '../../services/conversation-service';

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

  constructor() {
    this.socketService = SocketService.getInstance();
    this.conversationService = new ConversationService();
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
      
      console.log(`🔔 Received Evolution webhook for instance ${instanceId}:`, webhookData);

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
        
        // 📥 Process incoming messages (MESSAGES_UPSERT)
        if (webhookData.event === 'messages.upsert' && webhookData.data['key'] && webhookData.data['message']) {
          console.log(`💬 [MESSAGES_UPSERT] Processing message for instance ${instanceId}`);
          await this.conversationService.handleIncomingMessage(instanceId, webhookData.data);
        }
        
        // 👤 Process contact updates (CONTACTS_UPDATE) - FOTO E NOME AUTOMÁTICOS!
        if (webhookData.event === 'contacts.update') {
          // Pode vir como array ou objeto
          const contacts = Array.isArray(webhookData.data) ? webhookData.data : [webhookData.data];
          
          for (const contactData of contacts) {
            const remoteJid = contactData.remoteJid;
            const profilePicUrl = contactData.profilePicUrl;
            const pushName = contactData.pushName;
            
            if (remoteJid && (profilePicUrl || pushName)) {
              console.log(`👤 [CONTACTS_UPDATE] ${pushName || remoteJid}: foto=${!!profilePicUrl}, nome=${!!pushName}`);
              await this.conversationService.updateContactFromWebhook(instanceId, remoteJid, {
                contactName: pushName,
                contactPicture: profilePicUrl
              });
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
        
        // 🔗 Process connection updates (CONNECTION_UPDATE)
        if (webhookData.event === 'connection.update') {
          const state = webhookData.data['state'];
          console.log(`🔗 [CONNECTION_UPDATE] Instance ${instanceId}: ${state}`);
          // TODO: Update instance status in database
        }
        
        // 📱 Process QR code updates (QRCODE_UPDATED)
        if (webhookData.event === 'qrcode.updated') {
          console.log(`📱 [QRCODE_UPDATED] New QR available for ${instanceId}`);
          // TODO: Emit new QR via WebSocket
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