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
      const { instanceId } = req.params;
      
      if (!instanceId) {
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
        // Check if this is a message event
        if (webhookData.data['key'] && webhookData.data['message']) {
          console.log(`💬 Processing incoming message for instance ${instanceId}`);
          await this.conversationService.handleIncomingMessage(instanceId, webhookData.data);
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