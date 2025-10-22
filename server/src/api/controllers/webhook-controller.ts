import { Request, Response } from 'express';
import { z } from 'zod';
import { WebhookEvent } from '../../types';
import { SocketService } from '../../services/socket-service';

// Validation schema for webhook events
const webhookEventSchema = z.object({
  instanceKey: z.string(),
  data: z.record(z.any()),
  datetime: z.string(),
  sender: z.string(),
  serverUrl: z.string(),
});

export class WebhookController {
  private socketService: SocketService;

  constructor() {
    this.socketService = SocketService.getInstance();
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
      
      console.log(`Received Evolution webhook for instance ${instanceId}:`, webhookData);

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